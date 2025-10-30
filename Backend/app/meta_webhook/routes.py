from fastapi import APIRouter, Request, Query, Response
from app.database.mongo import contacts_collection, messages_collection
from app.websocket.routes import notify_all
from app.meta_webhook.controllers import get_instagram_username, get_messenger_user
from datetime import datetime, timedelta
import pytz
import os
import json
import requests
import boto3
from dotenv import load_dotenv
import hashlib


load_dotenv()
router = APIRouter()
MESSAGE_CACHE_TTL = 3600
processed_messages = {}

# --- AWS S3 ---
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
BUCKET_NAME = "imgbrain"
REGION = "us-east-1"

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=REGION
)

# --- WhatsApp ---
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")

def get_message_hash(user_id: str, content: str, timestamp: int) -> str:
    """Crear hash único para identificar duplicados"""
    combined = f"{user_id}:{content}:{timestamp}"
    return hashlib.md5(combined.encode()).hexdigest()


def is_duplicate_message(user_id: str, content: str, timestamp: int) -> bool:
    """Verificar si el mensaje ya fue procesado"""
    msg_hash = get_message_hash(user_id, content, timestamp)
    
    # Limpiar cache antiguo
    current_time = datetime.now().timestamp()
    to_delete = [k for k, v in processed_messages.items() if current_time - v > MESSAGE_CACHE_TTL]
    for k in to_delete:
        del processed_messages[k]
    
    # Verificar si es duplicado
    if msg_hash in processed_messages:
        return True
    
    # Guardar como procesado
    processed_messages[msg_hash] = current_time
    return False



def upload_to_s3(file_bytes: bytes, filename: str, content_type: str) -> str:
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=filename,
        Body=file_bytes,
        ContentType=content_type,
    )
    return f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{filename}"


def get_whatsapp_media_url(media_id: str) -> dict:
    url = f"https://graph.facebook.com/v20.0/{media_id}"
    headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
    return requests.get(url, headers=headers).json()


def download_whatsapp_media(download_url: str) -> bytes:
    headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
    return requests.get(download_url, headers=headers).content


# --- Verify webhook ---
@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    VERIFY_TOKEN = os.getenv("VERIFY_TOKEN", "my_verify_token")
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return Response(content=hub_challenge or "", media_type="text/plain")
    return {"error": "Verification failed"}


# --- Receive webhook ---
@router.post("/webhook")
async def meta_webhook(request: Request):
    body = await request.json()
    print("🔔 Webhook recibido:", json.dumps(body, indent=2))

    object_type = body.get("object", "")
    if "entry" not in body:
        return {"status": "no_entry"}

    for entry in body["entry"]:

        # 📲 WHATSAPP
        if "changes" in entry:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for msg in value.get("messages", []):
                    wa_id = msg.get("from")
                    profile_name = value.get("contacts", [{}])[0].get("profile", {}).get("name", wa_id)
                    tz_now = datetime.now(pytz.timezone('America/Bogota'))

                    msg_type = "text"
                    content = ""
                    text_for_front = ""

                    if "text" in msg:
                        content = msg["text"]["body"]
                        text_for_front = content
                        msg_type = "text"

                    elif msg.get("type") == "image":
                        media_id = msg["image"]["id"]
                        mime_type = msg["image"]["mime_type"]
                        media_info = get_whatsapp_media_url(media_id)
                        media_url = media_info.get("url")
                        media_bytes = download_whatsapp_media(media_url)
                        ext = mime_type.split("/")[-1]
                        filename = f"whatsapp/{wa_id}/{media_id}.{ext}"
                        content = upload_to_s3(media_bytes, filename, mime_type)
                        msg_type = "image"
                        text_for_front = "📎 Archivo"

                    else:
                        continue

                    # Guardar conversación
                    conv = await contacts_collection.find_one_and_update(
                        {"user_id": wa_id, "platform": "whatsapp"},
                        {
                            "$set": {
                                "last_message": text_for_front,
                                "timestamp": tz_now,
                                "name": profile_name,
                                "gestionado": False,
                                "bot_active": True
                            },
                            "$inc": {"unread": 1},
                            "$push": {
                                "messages": {
                                    "text": content if msg_type == "text" else text_for_front,
                                    "timestamp": tz_now,
                                    "from": "user",
                                    "type": msg_type
                                }
                            }
                        },
                        upsert=True,
                        return_document=True
                    )

                    # Guardar mensaje
                    new_message = {
                        "conversation_id": str(conv["_id"]),
                        "sender": "user",
                        "type": msg_type,
                        "content": content,
                        "timestamp": tz_now
                    }
                    await messages_collection.insert_one(new_message)

                    # Notificar al front
                    ws_message = {
                        "user_id": wa_id,
                        "conversation_id": str(conv["_id"]),
                        "platform": "whatsapp",
                        "type": msg_type,
                        "content": content,
                        "timestamp": tz_now.isoformat(),
                        "direction": "inbound",
                        "remitente": profile_name
                    }
                    if msg_type == "text":
                        ws_message["text"] = text_for_front
                    else:
                        ws_message["media_url"] = content

                    await notify_all(ws_message)
                    print(f"[WhatsApp] {profile_name}: {content}")

                    # Reenviar a n8n 🚀
                    try:
                        n8n_url = os.getenv("N8N_WEBHOOK_URL_WHATSAPP")
                        payload = {
                            "user_id": wa_id,
                            "name": profile_name,
                            "type": msg_type,
                            "content": content,
                            "timestamp": tz_now.isoformat(),
                            "bot_active": bool(True)  # ✅ Asegura tipo booleano real
                        }
                        print("🧠 Tipo bot_active:", type(payload["bot_active"]))  # Debug
                        requests.post(
                            n8n_url,
                            json=payload,
                            headers={"Content-Type": "application/json"},
                            timeout=5
                        )
                        print("📤 Enviado a n8n:", payload)
                    except Exception as e:
                        print("⚠️ Error enviando a n8n:", str(e))

        # 💬 MESSENGER
        if object_type == "page" and "messaging" in entry:
            for event in entry.get("messaging", []):
                sender_id = event.get("sender", {}).get("id")
                recipient_id = event.get("recipient", {}).get("id")
                message = event.get("message", {}) or {}
                message_text = message.get("text", "")
                attachments = message.get("attachments", [])
                is_echo = message.get("is_echo", False)
                tz_now = datetime.now(pytz.timezone("America/Bogota"))

                if not sender_id:
                    continue

                user_id = recipient_id if is_echo else sender_id
                remitente = "system"
                if not is_echo:
                    user_info = await get_messenger_user(user_id)
                    remitente = (
                        f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip()
                        if user_info else user_id
                    )

                msg_type = "text"
                content = ""
                text_for_front = ""

                if message_text:
                    content = message_text
                    text_for_front = content
                elif attachments:
                    content = attachments[0]["payload"].get("url", "")
                    msg_type = "file"
                    text_for_front = "📎 Archivo"
                else:
                    continue

                conv = await contacts_collection.find_one_and_update(
                    {"user_id": user_id, "platform": "messenger"},
                    {
                        "$set": {
                            "last_message": text_for_front,
                            "timestamp": tz_now,
                            "name": remitente,
                            "gestionado": False,
                            "bot_active": True
                        },
                        "$inc": {"unread": 1 if not is_echo else 0}
                    },
                    upsert=True,
                    return_document=True
                )

                new_message = {
                    "conversation_id": str(conv["_id"]),
                    "sender": "user" if not is_echo else "system",
                    "type": msg_type,
                    "content": content,
                    "timestamp": tz_now
                }
                await messages_collection.insert_one(new_message)

                ws_message = {
                    "user_id": user_id,
                    "conversation_id": str(conv["_id"]),
                    "platform": "messenger",
                    "type": msg_type,
                    "content": content,
                    "timestamp": tz_now.isoformat(),
                    "direction": "inbound" if not is_echo else "outbound",
                    "remitente": remitente
                }
                if msg_type == "text":
                    ws_message["text"] = content
                else:
                    ws_message["media_url"] = content

                await notify_all(ws_message)
                print(f"[Messenger] {remitente}: {content}")

                try:
                    n8n_url = os.getenv("N8N_WEBHOOK_URL_FACEBOOK")
                    payload = {
                        "user_id": user_id,
                        "name": remitente,
                        "type": msg_type,
                        "content": content,
                        "timestamp": tz_now.isoformat(),
                        "bot_active": bool(True)
                    }
                    requests.post(
                        n8n_url,
                        json=payload,
                        headers={"Content-Type": "application/json"},
                        timeout=5
                    )
                    print("📤 Enviado a n8n:", payload)
                except Exception as e:
                    print("⚠️ Error enviando a n8n:", str(e))

        # 📷 INSTAGRAM
        if object_type == "instagram":
            messaging_events = entry.get("messaging", []) or entry.get("standby", [])
            for event in messaging_events:
                sender_id = event.get("sender", {}).get("id")
                recipient_id = event.get("recipient", {}).get("id")
                message = event.get("message", {}) or {}
                message_text = message.get("text", "")
                attachments = message.get("attachments", [])
                timestamp = event.get("timestamp", 0)
                tz_now = datetime.now(pytz.timezone("America/Bogota"))

                if not sender_id:
                    continue

                is_echo = message.get("is_echo", False)
                user_id = recipient_id if is_echo else sender_id
                username = await get_instagram_username(user_id)
                remitente = username or user_id

                msg_type = "text"
                content = ""
                text_for_front = ""

                if message_text:
                    content = message_text
                    text_for_front = content
                elif attachments:
                    content = attachments[0]["payload"].get("url", "")
                    msg_type = "file"
                    text_for_front = "📎 Archivo"
                else:
                    continue

                if is_duplicate_message(user_id, content, timestamp):
                    print(f"🚫 Mensaje duplicado ignorado: {remitente}: {content}")
                    continue

                conv = await contacts_collection.find_one_and_update(
                    {"user_id": user_id, "platform": "instagram"},
                    {
                        "$set": {
                            "last_message": text_for_front,
                            "timestamp": tz_now,
                            "name": remitente,
                            "gestionado": False,
                            "bot_active": True
                        },
                        "$inc": {"unread": 1 if not is_echo else 0}
                    },
                    upsert=True,
                    return_document=True
                )

                new_message = {
                    "conversation_id": str(conv["_id"]),
                    "sender": "user" if not is_echo else "system",
                    "type": msg_type,
                    "content": content,
                    "timestamp": tz_now
                }
                await messages_collection.insert_one(new_message)

                if not is_echo:
                    ws_message = {
                        "user_id": user_id,
                        "conversation_id": str(conv["_id"]),
                        "platform": "instagram",
                        "type": msg_type,
                        "content": content,
                        "timestamp": tz_now.isoformat(),
                        "direction": "inbound",
                        "remitente": remitente
                    }
                    if msg_type == "text":
                        ws_message["text"] = content
                    else:
                        ws_message["media_url"] = content

                    await notify_all(ws_message)
                    print(f"[Instagram] {remitente}: {content}")

                # 🔒 No enviar a n8n si el mensaje es una respuesta (reply_to) o un share
                if not is_echo:
                    # 🚫 Si es respuesta o mención
                    if message.get("reply_to"):
                        print(f"🚫 Mención o respuesta detectada, no se envía a n8n: {remitente}")
                        continue

                    # 🚫 Si tiene attachments con tipo 'share'
                    if attachments and any(a.get("type") == "share" for a in attachments):
                        print(f"🚫 Mensaje con attachment tipo 'share' detectado, no se envía a n8n: {remitente}")
                        # 👇 Importante: continúa el flujo (ya se guardó en BD y se notificó),
                        # pero no hace el POST a n8n
                        continue

                    # ✅ Si pasa todos los filtros, enviarlo a n8n
                    try:
                        n8n_url = os.getenv("N8N_WEBHOOK_URL_INSTAGRAM")
                        payload = {
                            "user_id": user_id,
                            "name": remitente,
                            "type": msg_type,
                            "content": content,
                            "timestamp": tz_now.isoformat(),
                            "bot_active": bool(True)
                        }
                        requests.post(
                            n8n_url,
                            json=payload,
                            headers={"Content-Type": "application/json"},
                            timeout=5
                        )
                        print("📤 Enviado a n8n:", payload)
                    except Exception as e:
                        print("⚠️ Error enviando a n8n:", str(e))

        return {"status": "received"}


