# app/instagram_integration/routes.py
from app.instagram_integration.controllers import send_instagram_message, send_instagram_image
from app.database.mongo import contacts_collection, messages_collection
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from datetime import datetime, timezone
from bson import ObjectId
import pytz
import os
import boto3

PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN")
if not PAGE_ACCESS_TOKEN:
    raise RuntimeError("❌ PAGE_ACCESS_TOKEN no está configurado en las variables de entorno.")

router = APIRouter()
bogota_tz = pytz.timezone("America/Bogota")

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

def utc_now():
    return datetime.now(timezone.utc)

def upload_to_s3(file_bytes: bytes, filename: str, content_type: str) -> str:
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=filename,
        Body=file_bytes,
        ContentType=content_type
    )
    return f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{filename}"


# -----------------------
# Enviar mensaje de texto
# -----------------------
@router.post("/instagram/send")
async def send_message_instagram(
    user_id: str = Form(...),
    username: str = Form(None),
    text: str = Form(...)
):
    if not text:
        raise HTTPException(status_code=400, detail="Debe enviar un texto válido")
    
    try:
        # 1️⃣ Enviar mensaje a Instagram
        await send_instagram_message(user_id, text)

        # 2️⃣ Procesar contacto y conversación
        now_utc = utc_now()
        username = username or "Cliente Instagram"

        contact = await contacts_collection.find_one({"user_id": user_id, "platform": "instagram"})
        conversation_id = str(contact["_id"]) if contact else str(ObjectId())

        # 3️⃣ Actualizar contacto
        await contacts_collection.find_one_and_update(
            {"user_id": user_id, "platform": "instagram"},
            {"$set": {
                "last_message": text,
                "timestamp": now_utc,
                "name": username,
                "unread": 0,
                "conversation_id": conversation_id,
                "updated_at": now_utc
            },
            "$setOnInsert": {"created_at": now_utc}},
            upsert=True
        )

        # 4️⃣ Guardar mensaje en Mongo (una sola vez)
        message_doc = {
            "conversation_id": conversation_id,
            "sender": "system",
            "type": "text",
            "content": text,
            "timestamp": now_utc
        }
        await messages_collection.insert_one(message_doc)

        return {
            "status": "success",
            "message": "Mensaje enviado correctamente",
            "platform": "instagram",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "timestamp": now_utc.isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# -----------------------
# Enviar imagen
# -----------------------
@router.post("/send_image_file")
async def send_instagram_image_file(
    user_id: str = Form(...),
    file: UploadFile = File(...),
    username: str = Form(None)
):
    """
    Recibe un archivo de imagen, lo sube a S3 y lo envía a Instagram.
    Guarda la URL en Mongo y notifica/guarda solo una vez.
    """
    try:
        now_utc = utc_now()
        username = username or "Cliente Instagram"

        # 1️⃣ Leer archivo
        file_bytes = await file.read()
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"

        # 2️⃣ Subir a S3
        filename_s3 = f"instagram/{user_id}/{int(now_utc.timestamp())}.{ext}"
        media_url_s3 = upload_to_s3(file_bytes, filename_s3, file.content_type)

        # 3️⃣ Enviar imagen a Instagram usando la URL de S3
        await send_instagram_image(user_id, media_url_s3, is_url=True)

        # 4️⃣ Procesar contacto y conversación
        contact = await contacts_collection.find_one({"user_id": user_id, "platform": "instagram"})
        conversation_id = str(contact["_id"]) if contact else str(ObjectId())

        # 5️⃣ Actualizar contacto
        await contacts_collection.find_one_and_update(
            {"user_id": user_id, "platform": "instagram"},
            {"$set": {
                "last_message": "📷 Imagen",
                "timestamp": now_utc,
                "name": username,
                "unread": 0,
                "conversation_id": conversation_id,
                "updated_at": now_utc
            },
            "$setOnInsert": {"created_at": now_utc}},
            upsert=True
        )

        # 6️⃣ Guardar mensaje en Mongo (una sola vez)
        message_doc = {
            "conversation_id": conversation_id,
            "sender": "system",
            "type": "image",
            "content": media_url_s3,
            "timestamp": now_utc
        }
        await messages_collection.insert_one(message_doc)

        return {
            "status": "success",
            "message": "Imagen enviada correctamente",
            "platform": "instagram",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "s3_url": media_url_s3,
            "timestamp": now_utc.isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
