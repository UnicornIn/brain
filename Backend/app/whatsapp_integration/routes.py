from fastapi import APIRouter, Depends, HTTPException, status
from app.whatsapp_integration.models import WhatsAppMessageSchema
from app.whatsapp_integration.controllers import send_whatsapp_message
from app.database.mongo import messages_collection
from app.auth.jwt.jwt import get_current_user
from datetime import datetime
from app.websocket.routes import notify_all
import os

import json

router = APIRouter()

@router.post("/whatsapp/send-message")
async def send_message(
    data: WhatsAppMessageSchema,
    user: dict = Depends(get_current_user(["admin"]))
):
    phone_number_id = os.getenv("WHATSAPP_PHONE_ID")
    print(f"Received data: {data}")
    print(f"Using phone_number_id: {phone_number_id}")

    if not phone_number_id:
        print("WHATSAPP_PHONE_ID not configured")
        raise HTTPException(status_code=500, detail="WHATSAPP_PHONE_ID no configurado")

    try:
        result = await send_whatsapp_message(data.wa_id, data.text, phone_number_id)
        print(f"send_whatsapp_message result: {result}")

        # Guardar en conversación
        await messages_collection.update_one(
            {"user_id": data.wa_id, "platform": "whatsapp"},
            {
                "$push": {
                    "messages": {
                        "sender": "system",
                        "name": user["name"],
                        "content": data.text,
                        "timestamp": datetime.utcnow()
                    }
                },
                "$set": {
                    "last_message": data.text
                }
            },
            upsert=True
        )

        return {"status": "ok", "response": result}

    except Exception as e:
        print(f"Error sending WhatsApp message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


