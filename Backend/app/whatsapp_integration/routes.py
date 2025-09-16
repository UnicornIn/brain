from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from typing import Optional
from app.whatsapp_integration.controllers import send_whatsapp_message
from app.database.mongo import contacts_collection, messages_collection
from datetime import datetime, timezone
import os
import httpx
from bson import ObjectId
import pytz

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")

router = APIRouter()

# --- Utilidad para limpiar documentos de Mongo ---
def clean_mongo_doc(doc: dict) -> dict:
    """Convierte ObjectId y datetime en tipos serializables (str) y ajusta hora a Bogotá."""
    clean = {}
    bogota_tz = pytz.timezone("America/Bogota")

    for k, v in doc.items():
        if isinstance(v, ObjectId):
            clean[k] = str(v)
        elif isinstance(v, datetime):
            # Si ya tiene zona horaria, convertir a Bogotá
            if v.tzinfo is not None:
                bogota_time = v.astimezone(bogota_tz)
            else:
                # Asumir que es UTC si no tiene zona horaria
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
    image: Optional[UploadFile] = File(None)
):
    phone_number_id = os.getenv("WHATSAPP_PHONE_ID")

    if not phone_number_id:
        raise HTTPException(status_code=500, detail="WHATSAPP_PHONE_ID no configurado")

    try:
        # 🕒 Guardar SIEMPRE en UTC
        utc_now = datetime.now(timezone.utc)

        last_message = None
        msg_type = "text"
        content = None

        if image:
            # 📤 Subir la imagen a Facebook Graph API
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

            # 📩 Enviar el mensaje de tipo imagen
            result = await send_whatsapp_message(wa_id, media_id, phone_number_id, "image_id")

            last_message = "📎 Archivo"
            content = media_id
            msg_type = "image"

        elif text:
            # 📩 Enviar texto normal
            result = await send_whatsapp_message(wa_id, text, phone_number_id, "text")

            last_message = text
            content = text
            msg_type = "text"

        else:
            raise HTTPException(status_code=400, detail="Debe enviar texto o imagen")

        # 1️⃣ OBTENER EL NOMBRE REAL DEL CONTACTO EN LUGAR DE "invitado"
        # Buscar la conversación existente para obtener el nombre real
        existing_conv = await contacts_collection.find_one({"user_id": wa_id, "platform": "whatsapp"})
        nombre_contacto = existing_conv.get("name", "Cliente") if existing_conv else "Cliente"

        # 2️⃣ Asegurar conversación (usar el nombre real)
        conv = await contacts_collection.find_one_and_update(
            {"user_id": wa_id, "platform": "whatsapp"},
            {
                "$set": {
                    "last_message": last_message,
                    "timestamp": utc_now,   # 🔹 Guardamos UTC
                    "name": nombre_contacto  # 🔹 Usar el nombre real, no "invitado"
                }
            },
            upsert=True,
            return_document=True
        )

        # 3️⃣ Guardar mensaje como documento independiente (usar nombre real)
        new_message = {
            "conversation_id": str(conv["_id"]),
            "sender": "system",
            "name": nombre_contacto,  # 🔹 Usar el nombre real
            "type": msg_type,
            "content": content,
            "timestamp": utc_now   # 🔹 Guardamos UTC
        }
        await messages_collection.insert_one(new_message)

        # Convertir a hora de Bogotá para la respuesta
        bogota_tz = pytz.timezone("America/Bogota")
        bogota_time = utc_now.astimezone(bogota_tz)

        return {
            "status": "ok",
            "response": result,
            "timestamp": bogota_time.isoformat(),  # 👈 Enviamos en hora de Bogotá
            "remitente": nombre_contacto  # 🔹 Enviar también el nombre para el frontend
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))