import os
import httpx
import pytz
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
import boto3
import requests

# Importar función para enviar mensajes a WhatsApp
from app.whatsapp_integration.controllers import send_whatsapp_message
# Colecciones Mongo
from app.database.mongo import contacts_collection, messages_collection
# WebSocket notify
from app.websocket.routes import notify_all

router = APIRouter()

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")

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

def upload_to_s3(file_bytes: bytes, filename: str, content_type: str) -> str:
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=filename,
        Body=file_bytes,
        ContentType=content_type,
    )
    return f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{filename}"

# --- Utilidad para limpiar documentos de Mongo ---
def clean_mongo_doc(doc: dict) -> dict:
    """Convierte ObjectId y datetime en tipos serializables (str) y ajusta hora a Bogotá."""
    clean = {}
    bogota_tz = pytz.timezone("America/Bogota")

    for k, v in doc.items():
        if isinstance(v, ObjectId):
            clean[k] = str(v)
        elif isinstance(v, datetime):
            if v.tzinfo is not None:
                bogota_time = v.astimezone(bogota_tz)
            else:
                utc_time = v.replace(tzinfo=pytz.UTC)
                bogota_time = utc_time.astimezone(bogota_tz)

            clean[k] = bogota_time.isoformat()
            clean[f"{k}_pretty"] = bogota_time.strftime("%Y-%m-%d %H:%M:%S")
        else:
            clean[k] = v
    return clean


@router.post("/whatsapp/send-message")
async def send_message(
    wa_id: str = Form(...),
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    document: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None)  # 🎵 NUEVO: parámetro para audio
):
    phone_number_id = os.getenv("WHATSAPP_PHONE_ID")

    if not phone_number_id:
        raise HTTPException(status_code=500, detail="WHATSAPP_PHONE_ID no configurado")

    try:
        utc_now = datetime.now(timezone.utc)

        last_message = None
        msg_type = "text"
        content = None
        media_url_s3 = None  # 🆕 URL de S3 para guardar en la base de datos

        if image:
            # 📤 Subir la imagen a Meta para enviar por WhatsApp
            upload_url = f"https://graph.facebook.com/v19.0/{phone_number_id}/media"
            headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
            
            # Leer el archivo de imagen
            image_bytes = await image.read()
            
            files = {"file": (image.filename, image_bytes, image.content_type)}
            data = {"messaging_product": "whatsapp"}

            async with httpx.AsyncClient() as client:
                upload_res = await client.post(upload_url, headers=headers, data=data, files=files)
                upload_json = upload_res.json()

            if "id" not in upload_json:
                raise HTTPException(status_code=500, detail=f"Error subiendo imagen: {upload_json}")

            media_id = upload_json["id"]
            result = await send_whatsapp_message(wa_id, media_id, phone_number_id, "image_id")

            # 🆕 GUARDAR IMAGEN EN S3 (igual que en el webhook)
            ext = image.content_type.split("/")[-1] if "/" in image.content_type else "jpg"
            filename = f"whatsapp/{wa_id}/{media_id}.{ext}"
            media_url_s3 = upload_to_s3(image_bytes, filename, image.content_type)
            
            last_message = "📷 Imagen"
            content = media_url_s3  # 🆕 Guardar URL de S3 en lugar del media_id
            msg_type = "image"

        elif document:
            # 📤 Subir documento a Meta para enviar por WhatsApp
            upload_url = f"https://graph.facebook.com/v19.0/{phone_number_id}/media"
            headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
            
            # Leer el archivo de documento
            document_bytes = await document.read()
            
            files = {"file": (document.filename, document_bytes, document.content_type)}
            data = {"messaging_product": "whatsapp"}

            async with httpx.AsyncClient() as client:
                upload_res = await client.post(upload_url, headers=headers, data=data, files=files)
                upload_json = upload_res.json()

            if "id" not in upload_json:
                raise HTTPException(status_code=500, detail=f"Error subiendo documento: {upload_json}")

            media_id = upload_json["id"]
            result = await send_whatsapp_message(
                wa_id, media_id, phone_number_id, "document_id", document.filename
            )

            # 🆕 GUARDAR DOCUMENTO EN S3
            ext = document.filename.split(".")[-1] if "." in document.filename else "pdf"
            filename = f"whatsapp/{wa_id}/{media_id}.{ext}"
            media_url_s3 = upload_to_s3(document_bytes, filename, document.content_type)

            last_message = "📎 Documento"
            content = media_url_s3  # 🆕 Guardar URL de S3
            msg_type = "document"

        elif audio:  # 🎵 NUEVO: Manejo de audio
            # 📤 Subir audio a Meta para enviar por WhatsApp
            upload_url = f"https://graph.facebook.com/v19.0/{phone_number_id}/media"
            headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
            
            # Leer el archivo de audio
            audio_bytes = await audio.read()
            
            files = {"file": (audio.filename, audio_bytes, audio.content_type)}
            data = {"messaging_product": "whatsapp"}

            async with httpx.AsyncClient() as client:
                upload_res = await client.post(upload_url, headers=headers, data=data, files=files)
                upload_json = upload_res.json()

            if "id" not in upload_json:
                raise HTTPException(status_code=500, detail=f"Error subiendo audio: {upload_json}")

            media_id = upload_json["id"]
            result = await send_whatsapp_message(wa_id, media_id, phone_number_id, "audio_id")

            # 🆕 GUARDAR AUDIO EN S3
            ext = audio.content_type.split("/")[-1] if "/" in audio.content_type else "mp3"
            filename = f"whatsapp/{wa_id}/{media_id}.{ext}"
            media_url_s3 = upload_to_s3(audio_bytes, filename, audio.content_type)

            last_message = "🎵 Audio"
            content = media_url_s3  # 🆕 Guardar URL de S3
            msg_type = "audio"

        elif text:
            # 📩 Texto
            result = await send_whatsapp_message(wa_id, text, phone_number_id, "text")

            last_message = text
            content = text
            msg_type = "text"

        else:
            raise HTTPException(status_code=400, detail="Debe enviar texto, imagen, documento o audio")

        # 1️⃣ Obtener nombre real del contacto
        existing_conv = await contacts_collection.find_one({"user_id": wa_id, "platform": "whatsapp"})
        nombre_contacto = existing_conv.get("name", "Cliente") if existing_conv else "Cliente"

        # 2️⃣ Actualizar conversación
        conv = await contacts_collection.find_one_and_update(
            {"user_id": wa_id, "platform": "whatsapp"},
            {
                "$set": {
                    "last_message": last_message,
                    "timestamp": utc_now,
                    "name": nombre_contacto
                }
            },
            upsert=True,
            return_document=True
        )

        # 3️⃣ Guardar mensaje con URL de S3
        new_message = {
            "conversation_id": str(conv["_id"]),
            "sender": "system",
            "name": nombre_contacto,
            "type": msg_type,
            "content": content,  # 🆕 Ahora contiene la URL de S3 para imágenes/documentos/audio
            "timestamp": utc_now
        }
        await messages_collection.insert_one(new_message)

        # Convertir timestamp a Bogotá
        bogota_tz = pytz.timezone("America/Bogota")
        bogota_time = utc_now.astimezone(bogota_tz)

        # 4️⃣ Notificar a WebSocket
        notification_message = {
            "type": "new_message",
            "user_id": wa_id,
            "platform": "whatsapp",
            "text": last_message,
            "timestamp": bogota_time.isoformat(),
            "direction": "outbound",
            "remitente": nombre_contacto,
            "message_type": msg_type,
            "content": content  # 🆕 URL de S3 para que el frontend pueda mostrar la imagen
        }
        await notify_all(notification_message)

        return {
            "status": "ok",
            "response": result,
            "timestamp": bogota_time.isoformat(),
            "remitente": nombre_contacto,
            "message_type": msg_type,
            "content": content
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))