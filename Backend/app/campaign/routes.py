from fastapi import APIRouter, Depends, HTTPException
from app.campaign.controllers import generate_campaign_text, send_whatsapp_campaign
from app.auth.jwt.jwt import get_current_user
import os

router = APIRouter()

@router.post("/whatsapp/send-campaign")
async def send_campaign(
    wa_id: str, 
    prompt: str, 
    _: dict = Depends(get_current_user(["admin"]))
):
    phone_number_id = os.getenv("WHATSAPP_PHONE_ID")
    if not phone_number_id:
        raise HTTPException(status_code=500, detail="WHATSAPP_PHONE_ID no configurado")

    try:
        # Generar texto con GPT
        campaign_text = await generate_campaign_text(prompt)

        # Enviar mensaje a WhatsApp
        result = await send_whatsapp_campaign(wa_id, campaign_text)

        return {
            "status": "ok",
            "to": wa_id,
            "campaign_text": campaign_text,
            "response": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
