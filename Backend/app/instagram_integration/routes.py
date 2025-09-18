from app.instagram_integration.controllers import send_instagram_message
from app.instagram_integration.models import InstagramSendMessage
from app.database.mongo import contacts_collection, messages_collection
from app.auth.jwt.jwt import get_current_user
from app.websocket.routes import notify_all
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import pytz
from bson import ObjectId

router = APIRouter()

# --- Zona horaria Bogotá ---
bogota_tz = pytz.timezone("America/Bogota")

def utc_now():
    return datetime.now(timezone.utc)

# --- Utilidad para limpiar documentos de Mongo ---
def clean_mongo_doc(doc: dict) -> dict:
    """Convierte ObjectId y datetime en tipos serializables (str) y ajusta hora a Bogotá."""
    clean = {}
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

@router.post("/instagram/send")
async def send_message_instagram(
    payload: InstagramSendMessage,
    user: dict = Depends(get_current_user(["admin"]))
):
    """
    Enviar mensaje a un usuario de Instagram.
    Guarda contacto y mensaje como documento independiente en messages_collection.
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

        # 2️⃣ Guardar/actualizar contacto
        contact_doc = await contacts_collection.find_one_and_update(
            {"user_id": user_id, "platform": "instagram"},
            {
                "$set": {
                    "last_message": last_message,
                    "timestamp": now_utc,
                    "name": username,
                    "unread": 0
                }
            },
            upsert=True,
            return_document=True
        )
        conversation_id = str(contact_doc["_id"])

        # 3️⃣ Guardar mensaje como documento independiente
        new_message_doc = {
            "conversation_id": conversation_id,
            "sender": "system",
            "type": "text",
            "content": last_message,
            "timestamp": now_utc
        }
        inserted = await messages_collection.insert_one(new_message_doc)
        new_message_doc["_id"] = inserted.inserted_id

        # 4️⃣ Notificar al frontend
        ws_message = {
            "user_id": user_id,
            "platform": "instagram",
            "username": username,
            "type": "text",
            "content": last_message,
            "timestamp": now_utc.isoformat(),
            "direction": "outbound",
            "remitente": user["name"]
        }
        await notify_all(ws_message)

        return {
            "status": "sent",
            "message": clean_mongo_doc(new_message_doc),
            "instagram_response": response.json()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
