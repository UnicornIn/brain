from fastapi import APIRouter, HTTPException, UploadFile, File
from app.facebook_integration.controllers import (
    send_messenger_message,
    get_messenger_user_name,
    send_messenger_image,
    upload_and_send_messenger_image
)
from app.facebook_integration.models import MessengerSendMessage
from app.database.mongo import contacts_collection, messages_collection
from app.websocket.routes import notify_all
from datetime import datetime, timezone
import pytz
from bson import ObjectId
from pydantic import BaseModel
from typing import Any, Tuple, List
import os
import boto3


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
        ContentType=content_type,
    )
    return f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{filename}"


def utc_now():
    return datetime.now(timezone.utc)


def _parse_meta_response(resp: Any) -> Tuple[bool, int, dict]:
    """
    Normaliza la respuesta de la llamada a Meta (puede ser httpx.Response o dict).
    Retorna (ok_bool, status_code, data_dict)
    """
    if hasattr(resp, "status_code"):
        status = getattr(resp, "status_code", 500)
        try:
            data = resp.json()
        except Exception:
            data = {}
        ok = 200 <= status < 300
        return ok, status, data

    if isinstance(resp, dict):
        data = resp
        if any(k in data for k in ("message_id", "recipient_id", "id")) and not data.get("error"):
            return True, 200, data
        return False, 500, data

    return False, 500, {"error": "unknown_response", "raw": str(resp)}


def clean_mongo_doc(doc: dict) -> dict:
    """Limpiar documentos de Mongo para enviar al frontend"""
    from bson import ObjectId as _OID

    clean = {}
    for k, v in doc.items():
        if isinstance(v, _OID):
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


# -----------------------
# Enviar mensaje de texto
# -----------------------
@router.post("/messenger/send")
async def send_facebook_message(payload: MessengerSendMessage):
    try:
        # Enviar mensaje
        response = await send_messenger_message(payload.data.user_id, payload.data.text)
        ok, status_code, data = _parse_meta_response(response)
        if not ok:
            raise HTTPException(status_code=status_code, detail=f"Error enviando mensaje a Messenger: {data}")

        now_utc = utc_now()
        last_message = payload.data.text
        user_id = payload.data.user_id

        # Obtener contacto
        contact = await contacts_collection.find_one({"user_id": user_id, "platform": "messenger"})
        conversation_id = str(contact["_id"]) if contact else str(ObjectId())

        # Nombre del contacto
        nombre_contacto = (await get_messenger_user_name(user_id))["name"] or "Cliente"

        # Actualizar/crear contacto
        await contacts_collection.find_one_and_update(
            {"user_id": user_id, "platform": "messenger"},
            {"$set": {
                "last_message": last_message,
                "timestamp": now_utc,
                "name": nombre_contacto,
                "conversation_id": conversation_id,
                "unread": 0
            }},
            upsert=True
        )

        # Guardar mensaje en Mongo
        message_doc = {
            "conversation_id": conversation_id,
            "sender": "system",
            "type": "text",
            "content": last_message,
            "timestamp": now_utc,
        }
        await messages_collection.insert_one(message_doc)

        # Notificar frontend
        ws_message = {
            "user_id": user_id,
            "conversation_id": conversation_id,
            "platform": "messenger",
            "text": last_message,
            "timestamp": now_utc.isoformat(),
            "direction": "outbound",
            "remitente": nombre_contacto,
            "message_id": f"msg_{conversation_id}_{int(now_utc.timestamp())}"
        }
        await notify_all(ws_message)

        return {"status": "sent", "facebook_status": status_code, "facebook_response": data, "conversation_id": conversation_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.post("/messenger/send_image_file")
async def send_facebook_image_file(user_id: str, file: UploadFile = File(...)):
    """
    Recibe un archivo desde el dispositivo, lo sube a S3 y lo envía a Messenger.
    Guarda URL de S3 y metadatos en MongoDB.
    """
    try:
        now_utc = utc_now()
        file_bytes = await file.read()
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"

        # 1️⃣ Subir a S3
        filename_s3 = f"messenger/{user_id}/{int(now_utc.timestamp())}.{ext}"
        media_url_s3 = upload_to_s3(file_bytes, filename_s3, file.content_type)

        # 2️⃣ Enviar a Messenger usando la URL pública de S3
        response = await send_messenger_image(user_id, media_url_s3)

        # 3️⃣ Obtener contacto
        contact = await contacts_collection.find_one({"user_id": user_id, "platform": "messenger"})
        conversation_id = str(contact["_id"]) if contact else str(ObjectId())

        # 4️⃣ Obtener nombre de contacto
        nombre_contacto = (await get_messenger_user_name(user_id))["name"] or "Cliente"

        # 5️⃣ Actualizar/crear contacto
        await contacts_collection.find_one_and_update(
            {"user_id": user_id, "platform": "messenger"},
            {"$set": {
                "last_message": "📷 Imagen",
                "timestamp": now_utc,
                "name": nombre_contacto,
                "conversation_id": conversation_id,
                "unread": 0
            }},
            upsert=True
        )

        # 6️⃣ Guardar mensaje en Mongo
        message_doc = {
            "conversation_id": conversation_id,
            "sender": "system",
            "type": "image",
            "content": media_url_s3,
            "timestamp": now_utc,
        }
        await messages_collection.insert_one(message_doc)

        # 7️⃣ Notificar frontend
        ws_message = {
            "user_id": user_id,
            "conversation_id": conversation_id,
            "platform": "messenger",
            "text": "📷 Imagen",
            "timestamp": now_utc.isoformat(),
            "direction": "outbound",
            "remitente": nombre_contacto,
            "message_id": f"msg_{conversation_id}_{int(now_utc.timestamp())}",
            "content": media_url_s3,
            "message_type": "image"
        }
        await notify_all(ws_message)

        return {
            "status": "sent",
            "facebook_response": response,
            "s3_url": media_url_s3,
            "conversation_id": conversation_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
    
    