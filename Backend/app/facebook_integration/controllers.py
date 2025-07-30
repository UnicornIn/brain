import httpx
import os

PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN")

async def send_messenger_message(user_id: str, message: str):
    """
    Sends a text message to a Facebook Messenger user.
    """
    url = f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
    payload = {
        "recipient": {"id": user_id},
        "message": {"text": message},
        "messaging_type": "RESPONSE"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        print("📤 Enviado a Messenger:", response.status_code, response.text)
        return response