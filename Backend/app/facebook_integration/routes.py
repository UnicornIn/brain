from fastapi import APIRouter, Depends, HTTPException, Query
from app.facebook_integration.controllers import send_messenger_message, get_messenger_user_name
from app.facebook_integration.models import MessengerSendMessage
from app.database.mongo import contacts_collection, messages_collection
from app.auth.jwt.jwt import get_current_user
from app.websocket.routes import notify_all
from datetime import datetime, timezone
import httpx
import pytz
from bson import ObjectId
import os

router = APIRouter()

PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN")
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

@router.post("/messenger/send")
async def send_facebook_message(
    payload: MessengerSendMessage,
    user: dict = Depends(get_current_user(["admin"]))
):
    try:
        # 1️⃣ Enviar mensaje vía API de Messenger
        response = await send_messenger_message(payload.data.user_id, payload.data.text)

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error enviando mensaje a Messenger: {response.text}"
            )

        now_utc = utc_now()
        last_message = payload.data.text
        user_id = payload.data.user_id

        # 2️⃣ Obtener o crear contacto
        nombre_contacto = await get_messenger_user_name(user_id) or "Cliente"
        contact_doc = await contacts_collection.find_one_and_update(
            {"user_id": user_id, "platform": "messenger"},
            {
                "$set": {
                    "last_message": last_message,
                    "timestamp": now_utc,
                    "name": nombre_contacto,
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
            "platform": "messenger",
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
            "facebook_response": response.json()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


async def obtener_nombre_usuario_facebook(psid: str):
    url = f"https://graph.facebook.com/v19.0/{psid}"
    params = {
        "fields": "first_name,last_name",
        "access_token": PAGE_ACCESS_TOKEN
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)

    if response.status_code != 200:
        print("⚠️ Error al obtener nombre de usuario Facebook:", response.text)
        return None

    data = response.json()
    return f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()


@router.get("/messenger/userinfo")
async def get_user_info(psid: str = Query(..., description="Page Scoped ID del usuario de Messenger")):
    """Retorna el nombre y foto de perfil de un usuario de Messenger usando su PSID."""
    user_info = await get_messenger_user_name(psid)
    return user_info
