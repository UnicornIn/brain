import httpx
import os

PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN")

# Envía un mensaje directo a un usuario de Instagram
async def send_instagram_message(user_id: str, message: str):
    url = f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
    payload = {
        "recipient": {"id": user_id},  # <-- siempre numérico (sender_id)
        "message": {"text": message},
        "messaging_type": "RESPONSE"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        print("📤 Respuesta API Instagram:", response.status_code, response.text)
        return response


