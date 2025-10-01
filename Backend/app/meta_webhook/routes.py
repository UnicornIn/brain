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

load_dotenv()
router = APIRouter()

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

        # 📲 WhatsApp
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

                    # 1️⃣ Asegurar conversación y guardar mensaje en array
                    conv = await contacts_collection.find_one_and_update(
                        {"user_id": wa_id, "platform": "whatsapp"},
                        {
                            "$set": {
                                "last_message": text_for_front,
                                "timestamp": tz_now,
                                "name": profile_name,
                                "gestionado": False   # 👈 siempre se resetea a false
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

                    # 2️⃣ Guardar mensaje en colección separada
                    new_message = {
                        "conversation_id": str(conv["_id"]),
                        "sender": "user",
                        "type": msg_type,
                        "content": content,
                        "timestamp": tz_now
                    }
                    await messages_collection.insert_one(new_message)

                    # 3️⃣ Notificar al front
                    ws_message = {
                        "user_id": wa_id,
                        "conversation_id": str(conv["_id"]),
                        "platform": "whatsapp",
                        "type": msg_type,
                        "content": content,
                        "timestamp": tz_now.isoformat(),
                        "direction": "inbound",
                        "remitente": profile_name,
                    }

                    if msg_type == "text":
                        ws_message["text"] = text_for_front
                    else:
                        ws_message["media_url"] = content

                    print(f"[WhatsApp] {profile_name}: {content}")
                    await notify_all(ws_message)

                    # 4️⃣ Reenviar a n8n 🚀
                    try:
                        n8n_url = os.getenv("N8N_WEBHOOK_URL_WHATSAPP")
                        payload = {
                            "user_id": wa_id,
                            "name": profile_name,
                            "type": msg_type,
                            "content": content,
                            "timestamp": tz_now.isoformat(),
                        }
                        requests.post(n8n_url, json=payload, timeout=5)
                        print("📤 Enviado a n8n:", payload)
                    except Exception as e:
                        print("⚠️ Error enviando a n8n:", str(e))
        # 💬 Messenger
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

                # 🔥 SOLUCIÓN: Solo colección separada, sin array
                conv = await contacts_collection.find_one_and_update(
                    {"user_id": user_id, "platform": "messenger"},
                    {
                        "$set": {
                            "last_message": text_for_front,
                            "timestamp": tz_now,
                            "name": remitente,
                            "gestionado": False
                        },
                        "$inc": {"unread": 1 if not is_echo else 0}
                        # ❌ ELIMINADO: "$push" con array messages
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

                print(f"[Messenger] {remitente}: {content}")
                await notify_all(ws_message)
                try:
                    n8n_url = os.getenv("N8N_WEBHOOK_URL_FACEBOOK")
                    payload = {
                        "user_id": user_id,
                        "name": remitente,
                        "type": msg_type,
                        "content": content,
                        "timestamp": tz_now.isoformat(),
                    }
                    requests.post(n8n_url, json=payload, timeout=5)
                    print("📤 Enviado a n8n:", payload)
                except Exception as e:
                    print("⚠️ Error enviando a n8n:", str(e))
                
        # 📷 Instagram
        if object_type == "instagram":
            messaging_events = entry.get("messaging", []) or entry.get("standby", [])
            for event in messaging_events:
                sender_id = event.get("sender", {}).get("id")
                recipient_id = event.get("recipient", {}).get("id")
                message = event.get("message", {}) or {}
                message_text = message.get("text", "")
                attachments = message.get("attachments", [])
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

                # ✅ VERIFICACIÓN DE DUPLICADOS: Buscar si ya existe un mensaje idéntico reciente
                if is_echo:
                    # Para echo messages, verificar si ya existe un mensaje idéntico en los últimos 5 segundos
                    existing_message = await messages_collection.find_one({
                        "conversation_id": user_id,  # Usamos user_id como conversation_id temporalmente
                        "content": content,
                        "sender": "system",
                        "timestamp": {"$gte": tz_now - timedelta(seconds=5)}
                    })
                    
                    if existing_message:
                        print("🚫 Echo message duplicado ignorado:", content)
                        continue  # Ignorar este echo message porque ya existe

                # 🔥 Buscar o crear conversación
                conv = await contacts_collection.find_one_and_update(
                    {"user_id": user_id, "platform": "instagram"},
                    {
                        "$set": {
                            "last_message": text_for_front,
                            "timestamp": tz_now,
                            "name": remitente,
                            "gestionado": False
                        },
                        "$inc": {"unread": 1 if not is_echo else 0}
                    },
                    upsert=True,
                    return_document=True
                )

                # 2️⃣ Guardar en colección separada
                new_message = {
                    "conversation_id": str(conv["_id"]),
                    "sender": "user" if not is_echo else "system",
                    "type": msg_type,
                    "content": content,
                    "timestamp": tz_now
                }
                await messages_collection.insert_one(new_message)

                # 3️⃣ Notificar al front SOLO si no es echo message
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

                    print(f"[Instagram] {remitente}: {content}")
                    await notify_all(ws_message)

                # 4️⃣ Reenviar a n8n SOLO mensajes entrantes
                if not is_echo:
                    try:
                        n8n_url = os.getenv("N8N_WEBHOOK_URL_INSTAGRAM")
                        payload = {
                            "user_id": user_id,
                            "name": remitente,
                            "type": msg_type,
                            "content": content,
                            "timestamp": tz_now.isoformat(),
                        }
                        requests.post(n8n_url, json=payload, timeout=5)
                        print("📤 Enviado a n8n:", payload)
                    except Exception as e:
                        print("⚠️ Error enviando a n8n:", str(e))

    return {"status": "received"}


