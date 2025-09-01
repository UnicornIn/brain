from app.database.mongo import messages_collection
from fastapi import APIRouter, Request, Query, Response
from app.websocket.routes import notify_all
from datetime import datetime
import requests
import boto3
import pytz
import os
import json

router = APIRouter()

# --- Configuración AWS S3 ---
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")

if not AWS_ACCESS_KEY or not AWS_SECRET_KEY:
    raise RuntimeError("AWS credentials not found in environment variables.")
BUCKET_NAME = "imgbrain"
REGION = "us-east-1"

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=REGION
)

# --- Configuración WhatsApp ---
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")

# --- Helpers ---
def upload_to_s3(file_bytes: bytes, filename: str, content_type: str) -> str:
    """Sube un archivo a S3 y devuelve la URL pública."""
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=filename,
        Body=file_bytes,
        ContentType=content_type,
    )
    return f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{filename}"


def get_whatsapp_media_url(media_id: str) -> dict:
    """Obtiene la URL temporal de un archivo en WhatsApp."""
    url = f"https://graph.facebook.com/v20.0/{media_id}"
    headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
    res = requests.get(url, headers=headers)
    return res.json()


def download_whatsapp_media(download_url: str) -> bytes:
    """Descarga el archivo binario desde WhatsApp."""
    headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
    res = requests.get(download_url, headers=headers)
    return res.content


# --- Webhook Verify ---
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


# --- Webhook Receive ---
@router.post("/webhook")
async def meta_webhook(request: Request):
    body = await request.json()
    print("🔔 Webhook recibido:", json.dumps(body, indent=2))

    object_type = body.get("object", "")
    if "entry" not in body:
        return {"status": "no_entry"}

    # Zona horaria de Colombia
    tz = pytz.timezone("America/Bogota")

    for entry in body["entry"]:

        # 📲 WHATSAPP
        if "changes" in entry:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for msg in value.get("messages", []):
                    wa_id = msg.get("from")
                    profile_name = value.get("contacts", [{}])[0].get("profile", {}).get("name", "")
                    timestamp = datetime.now(tz)

                    # --- Texto ---
                    if "text" in msg:
                        text = msg["text"]["body"]
                        new_message = {
                            "sender": "user",
                            "type": "text",
                            "content": text,
                            "timestamp": timestamp
                        }

                    # --- Imagen ---
                    elif msg.get("type") == "image":
                        media_id = msg["image"]["id"]
                        mime_type = msg["image"]["mime_type"]

                        media_info = get_whatsapp_media_url(media_id)
                        media_url = media_info.get("url")
                        media_bytes = download_whatsapp_media(media_url)

                        ext = mime_type.split("/")[-1]
                        filename = f"whatsapp/{wa_id}/{media_id}.{ext}"
                        public_url = upload_to_s3(media_bytes, filename, mime_type)

                        new_message = {
                            "sender": "user",
                            "type": "image",
                            "content": public_url,
                            "timestamp": timestamp
                        }

                    else:
                        continue

                    # --- Guardar en DB ---
                    if new_message["type"] == "text":
                        last_message_preview = new_message["content"]
                    elif new_message["type"] == "image":
                        last_message_preview = "🖼 Imagen"
                    elif new_message["type"] == "audio":
                        last_message_preview = "🎵 Audio"
                    else:
                        last_message_preview = "📎 Archivo"

                    existing = messages_collection.find_one({"user_id": wa_id, "platform": "whatsapp"})
                    update_data = {
                        "$set": {
                            "last_message": last_message_preview,
                            "timestamp": timestamp,
                            "name": profile_name
                        },
                        "$inc": {"unread": 1},
                        "$push": {"messages": new_message}
                    }

                    messages_collection.update_one(
                        {"user_id": wa_id, "platform": "whatsapp"},
                        update_data,
                        upsert=True
                    )

                    print(f"[WhatsApp] {profile_name or wa_id}: {new_message['content']}")
                    await notify_all(new_message)

        # 💬 FACEBOOK MESSENGER
        if object_type == "page" and "messaging" in entry:
            for event in entry.get("messaging", []):
                sender_id = event.get("sender", {}).get("id")
                message_text = event.get("message", {}).get("text", "")
                timestamp = datetime.now(tz)  # ⏰ Ahora en hora de Colombia

                if sender_id and message_text:
                    new_message = {
                        "sender": "user",
                        "type": "text",
                        "content": message_text,
                        "timestamp": timestamp
                    }

                    existing = messages_collection.find_one({"user_id": sender_id, "platform": "messenger"})
                    update_data = {
                        "$set": {
                            "last_message": message_text,
                            "timestamp": timestamp
                        },
                        "$inc": {"unread": 1},
                        "$push": {"messages": new_message}
                    }
                    if not existing:
                        update_data["$set"]["name"] = None

                    messages_collection.update_one(
                        {"user_id": sender_id, "platform": "messenger"},
                        update_data,
                        upsert=True
                    )
                    await notify_all(new_message)

        # 📷 INSTAGRAM
        if object_type == "instagram":
            messaging_events = entry.get("messaging", []) or entry.get("standby", [])
            for event in messaging_events:
                sender_id = event.get("sender", {}).get("id")
                message_text = event.get("message", {}).get("text", "")
                timestamp = datetime.now(tz)  # ⏰ También hora de Colombia

                if sender_id and message_text:
                    new_message = {
                        "sender": "user",
                        "type": "text",
                        "content": message_text,
                        "timestamp": timestamp
                    }

                    existing = messages_collection.find_one({"user_id": sender_id, "platform": "instagram"})
                    update_data = {
                        "$set": {
                            "last_message": message_text,
                            "timestamp": timestamp
                        },
                        "$inc": {"unread": 1},
                        "$push": {"messages": new_message}
                    }
                    if not existing:
                        update_data["$set"]["name"] = "Desconocido"

                    messages_collection.update_one(
                        {"user_id": sender_id, "platform": "instagram"},
                        update_data,
                        upsert=True
                    )

                    print(f"[Instagram] {sender_id}: {message_text}")
                    await notify_all(new_message)

    return {"status": "received"}
