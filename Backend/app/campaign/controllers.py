import os
import asyncio
from openai import OpenAI
from app.whatsapp_integration.controllers import send_whatsapp_message

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID")

openai = OpenAI(api_key=OPENAI_KEY)

# 1. Generar copy con GPT
async def generate_campaign_text(prompt: str) -> str:
    system_msg = (
        "Eres un experto en marketing digital que crea textos profesionales, "
        "atractivos y efectivos para campañas de WhatsApp."
    )
    def call_openai():
        resp = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=400
        )
        return resp.choices[0].message.content.strip()
    
    return await asyncio.to_thread(call_openai)

# 2. Enviar mensaje a WhatsApp
async def send_whatsapp_campaign(wa_id: str, text: str, image_id: str = None) -> dict:
    if not WHATSAPP_PHONE_ID:
        return {"error": "WHATSAPP_PHONE_ID no configurado"}

    if image_id:
        return await send_whatsapp_message(wa_id, image_id, WHATSAPP_PHONE_ID, "image_id")
    else:
        return await send_whatsapp_message(wa_id, text, WHATSAPP_PHONE_ID, "text")

# 3. Flujo completo
async def create_and_send_campaign(wa_id: str, prompt: str, image_id: str = None) -> dict:
    campaign_text = await generate_campaign_text(prompt)
    response = await send_whatsapp_campaign(wa_id, campaign_text, image_id)
    return {
        "campaign_text": campaign_text,
        "response": response
    }
