from app.instagram_integration.controllers import send_instagram_message
from app.instagram_integration.models import InstagramSendMessage
from app.database.mongo import conversations_collection, messages_collection
from app.auth.jwt.jwt import get_current_user
from app.websocket.routes import notify_all
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import pytz

router = APIRouter()

# --- Zona horaria Bogotá ---
bogota_tz = pytz.timezone("America/Bogota")

def bogota_now():
    return datetime.now(bogota_tz)


@router.post("/instagram/send")
async def send_message_instagram(
    payload: InstagramSendMessage,
    user: dict = Depends(get_current_user(["admin"]))
):
    """
    Enviar mensaje a un usuario de Instagram usando Messenger API.
    Guarda en conversations_collection y messages_collection (misma estructura que el webhook).
    """
    try:
        # 1. Enviar mensaje a Instagram
        response = await send_instagram_message(payload.data.user_id, payload.data.text)

        if response.status_code == 200:
            tz_now = bogota_now()
            last_message = payload.data.text

            # 2️⃣ Asegurar conversación
            conv = await conversations_collection.find_one_and_update(
                {"user_id": payload.data.user_id, "platform": "instagram"},
                {
                    "$set": {
                        "last_message": last_message,
                        "timestamp": tz_now,
                        "name": payload.data.username or None
                    }
                },
                upsert=True,
                return_document=True
            )

            # 3️⃣ Guardar mensaje como documento independiente
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
                "platform": "instagram",
                "username": payload.data.username or None,
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
                "instagram_response": response.json()
            }

        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error enviando mensaje a Instagram: {response.text}"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

