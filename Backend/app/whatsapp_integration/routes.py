import os
import httpx
import pytz
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Form, File, UploadFile

# Importar función para enviar mensajes a WhatsApp
from app.whatsapp_integration.controllers import send_whatsapp_message
# Colecciones Mongo
from app.database.mongo import contacts_collection, messages_collection
# WebSocket notify
from app.websocket.routes import notify_all

router = APIRouter()

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")

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
    document: Optional[UploadFile] = File(None)
):
    phone_number_id = os.getenv("WHATSAPP_PHONE_ID")

    if not phone_number_id:
        raise HTTPException(status_code=500, detail="WHATSAPP_PHONE_ID no configurado")

    try:
        utc_now = datetime.now(timezone.utc)

        last_message = None
        msg_type = "text"
        content = None

        if image:
            # 📤 Subir la imagen
            upload_url = f"https://graph.facebook.com/v19.0/{phone_number_id}/media"
            headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
            files = {"file": (image.filename, await image.read(), image.content_type)}
            data = {"messaging_product": "whatsapp"}

            async with httpx.AsyncClient() as client:
                upload_res = await client.post(upload_url, headers=headers, data=data, files=files)
                upload_json = upload_res.json()

            if "id" not in upload_json:
                raise HTTPException(status_code=500, detail=f"Error subiendo imagen: {upload_json}")

            media_id = upload_json["id"]
            result = await send_whatsapp_message(wa_id, media_id, phone_number_id, "image_id")

            last_message = "📷 Imagen"
            content = media_id
            msg_type = "image"

        elif document:
            # 📤 Subir documento
            upload_url = f"https://graph.facebook.com/v19.0/{phone_number_id}/media"
            headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
            files = {"file": (document.filename, await document.read(), document.content_type)}
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

            last_message = "📎 Documento"
            content = media_id
            msg_type = "document"

        elif text:
            # 📩 Texto
            result = await send_whatsapp_message(wa_id, text, phone_number_id, "text")

            last_message = text
            content = text
            msg_type = "text"

        else:
            raise HTTPException(status_code=400, detail="Debe enviar texto, imagen o documento")

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

        # 3️⃣ Guardar mensaje
        new_message = {
            "conversation_id": str(conv["_id"]),
            "sender": "system",
            "name": nombre_contacto,
            "type": msg_type,
            "content": content,
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
            "content": content
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
