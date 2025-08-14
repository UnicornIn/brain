from fastapi import APIRouter, Depends, HTTPException, Query
from app.facebook_integration.controllers import get_messenger_user_name
from pydantic import BaseModel
from app.facebook_integration.controllers  import send_messenger_message
from app.facebook_integration.models import MessengerSendMessage
from app.auth.jwt.jwt import get_current_user
from app.database.mongo import messages_collection
from datetime import datetime
import httpx
import os


router = APIRouter()    

PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN")

@router.post("/send/messenger")
async def send_facebook_message(
    payload: MessengerSendMessage,
    user: dict = Depends(get_current_user(["admin"]))
):
    print(f"Enviando mensaje a {payload.data.user_id}: {payload.data.text}")

    try:
        response = await send_messenger_message(payload.data.user_id, payload.data.text)

        # Guardar en DB
        await messages_collection.update_one(
            {"user_id": payload.data.user_id, "platform": "facebook"},
            {
                "$push": {
                    "messages": {
                        "sender": "system",
                        "name": user["name"],
                        "content": payload.data.text,
                        "timestamp": datetime.utcnow()
                    }
                },
                "$set": {
                    "last_message": payload.data.text
                }
            }
        )

        return {
            "status": "sent",
            "to": payload.data.user_id,
            "message": payload.data.text,
            "facebook_response": response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar mensaje: {str(e)}")


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


@router.get("/facebook/userinfo")
async def get_user_info(psid: str = Query(..., description="Page Scoped ID del usuario de Messenger")):
    """
    Retorna el nombre y foto de perfil de un usuario de Messenger usando su PSID.
    """ 
    user_info = await get_messenger_user_name(psid)
    return user_info


    
