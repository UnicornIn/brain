import httpx
import os
from fastapi import HTTPException

PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN")

if not PAGE_ACCESS_TOKEN:
    raise RuntimeError("PAGE_ACCESS_TOKEN no está configurado en las variables de entorno.")

async def send_messenger_message(user_id: str, message: str):
    """
    Envía un mensaje de texto a un usuario de Facebook Messenger.
    """
    url = f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
    payload = {
        "recipient": {"id": user_id},
        "message": {"text": message},
        "messaging_type": "RESPONSE"
    }

    headers = {
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code != 200:
        print("❌ Error al enviar mensaje a Messenger:", response.status_code, response.text)
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Error al enviar mensaje: {response.text}"
        )

    print("📤 Enviado a Messenger:", response.status_code, response.text)
    return response.json()