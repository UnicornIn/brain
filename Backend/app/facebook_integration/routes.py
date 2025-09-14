from fastapi import APIRouter, Depends, HTTPException, Query
from app.facebook_integration.controllers import send_messenger_message, get_messenger_user_name
from app.facebook_integration.models import MessengerSendMessage
from app.database.mongo import conversations_collection, messages_collection
from app.auth.jwt.jwt import get_current_user
from app.websocket.routes import notify_all
from datetime import datetime
import httpx
import pytz
import os

router = APIRouter()

PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN")

bogota_tz = pytz.timezone("America/Bogota")

def bogota_now():
    return datetime.now(bogota_tz)


@router.post("/messenger/send")
async def send_facebook_message(
    payload: MessengerSendMessage,
    user: dict = Depends(get_current_user(["admin"]))
):
    try:
        # 1️⃣ Enviar mensaje vía API de Messenger
        response = await send_messenger_message(payload.data.user_id, payload.data.text)

        if response.status_code == 200:
            tz_now = bogota_now()
            last_message = payload.data.text

            # 2️⃣ Asegurar conversación
            conv = await conversations_collection.find_one_and_update(
                {"user_id": payload.data.user_id, "platform": "messenger"},
                {
                    "$set": {
                        "last_message": last_message,
                        "timestamp": tz_now
                    }
                },
                upsert=True,
                return_document=True
            )

            # 3️⃣ Insertar mensaje en messages_collection
            new_message = {
                "conversation_id": str(conv["_id"]),
                "sender": "system",
                "name": user["name"],
                "type": "text",
                "content": last_message,
                "timestamp": tz_now
            }
            await messages_collection.insert_one(new_message)

            # 4️⃣ Notificar al front
            ws_message = {
                "user_id": payload.data.user_id,
                "conversation_id": str(conv["_id"]),
                "platform": "messenger",
                "type": "text",
                "content": last_message,
                "timestamp": tz_now.isoformat(),
                "direction": "outbound",
                "remitente": user["name"]
            }
            await notify_all(ws_message)

            return {
                "status": "sent",
                "to": payload.data.user_id,
                "message": last_message,
                "facebook_response": response.json()
            }

        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error enviando mensaje a Messenger: {response.text}"
            )

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
    """
    Retorna el nombre y foto de perfil de un usuario de Messenger usando su PSID.
    """ 
    user_info = await get_messenger_user_name(psid)
    return user_info


