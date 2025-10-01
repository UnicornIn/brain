from app.instagram_integration.controllers import send_instagram_message
from app.instagram_integration.models import InstagramSendMessage
from app.database.mongo import contacts_collection
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import pytz

router = APIRouter()

# --- Zona horaria Bogotá ---
bogota_tz = pytz.timezone("America/Bogota")

def utc_now():
    return datetime.now(timezone.utc)

@router.post("/instagram/send")
async def send_message_instagram(payload: InstagramSendMessage):
    """
    Enviar mensaje a un usuario de Instagram.
    - SOLO envía a la API de Meta y actualiza la base de datos
    - NO envía WebSocket - el frontend ya muestra el mensaje localmente
    """
    try:
        # 1️⃣ Enviar mensaje a Instagram
        response = await send_instagram_message(payload.data.user_id, payload.data.text)

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error enviando mensaje a Instagram: {response.text}"
            )

        now_utc = utc_now()
        last_message = payload.data.text
        user_id = payload.data.user_id
        username = payload.data.username or "Cliente"

        # 2️⃣ Buscar contacto existente o crear uno nuevo con conversation_id
        contact = await contacts_collection.find_one({"user_id": user_id, "platform": "instagram"})
        
        if contact:
            conversation_id = contact.get("conversation_id", str(contact["_id"]))
        else:
            from bson import ObjectId
            new_contact_id = ObjectId()
            conversation_id = str(new_contact_id)

        # 3️⃣ Guardar/actualizar contacto CON conversation_id
        await contacts_collection.find_one_and_update(
            {"user_id": user_id, "platform": "instagram"},
            {
                "$set": {
                    "last_message": last_message,
                    "timestamp": now_utc,
                    "name": username,
                    "unread": 0,
                    "conversation_id": conversation_id
                }
            },
            upsert=True,
            return_document=True
        )

        # ❌ ELIMINADO: No enviar WebSocket - el frontend ya mostró el mensaje localmente

        return {
            "status": "sent",
            "instagram_response": response.json()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")