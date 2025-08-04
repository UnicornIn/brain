from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.facebook_integration.controllers  import send_messenger_message
from app.facebook_integration.models import MessengerSendMessage
from app.auth.jwt.jwt import get_current_user

router = APIRouter()


@router.post("/send/messenger")
async def send_facebook_message(
    data: MessengerSendMessage,
    user: dict = Depends(get_current_user(["admin"]))
):
    print(f"Enviando mensaje a {data.user_id}: {data.text}")

    return {"status": "sent", "to": data.user_id, "message": data.text}
