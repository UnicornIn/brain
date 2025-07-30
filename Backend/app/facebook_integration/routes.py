from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth.jwt.jwt import authenticate  # Si quieres proteger el endpoint
from app.facebook_integration.controllers  import send_messenger_message
from app.facebook_integration.models import MessengerSendMessage

router = APIRouter()


@router.post("/send/messenger")
async def send_message_messenger(data: MessengerSendMessage, user=Depends(authenticate)):
    """
    Envía un mensaje a un usuario de Facebook Messenger.
    """
    response = await send_messenger_message(data.user_id, data.text)

    if response.status_code == 200:
        return {"status": "sent", "result": response.json()}
    else:
        return {"error": "Failed to send message", "details": response.text}