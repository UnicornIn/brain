from fastapi import APIRouter, Depends
import os
from dotenv import load_dotenv

from app.whatsapp_integration.models import Message
from app.whatsapp_integration.controllers import send_whatsapp_message
from app.database.mongo import messages_collection
from app.auth.jwt.jwt import get_current_user

load_dotenv()

router = APIRouter()

@router.post("/send")
async def send_message(
    data: Message,
    user: dict = Depends(get_current_user)
):
    result = await send_whatsapp_message(data.wa_id, data.text)
    await messages_collection.insert_one(data.dict())
    return {"status": "sent", "result": result}
