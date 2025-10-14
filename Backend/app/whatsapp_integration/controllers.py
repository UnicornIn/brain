import httpx
import os
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")

async def send_whatsapp_message(to: str, content: str, phone_number_id: str, message_type: str = "text", filename: str = None):
    url = f"https://graph.facebook.com/v19.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    if message_type == "text":
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": content}
        }
    elif message_type == "image":  # cuando pasas un link directo
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "image",
            "image": {"link": content}
        }
    elif message_type == "image_id":  # cuando subes el archivo a Meta y usas el id
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "image",
            "image": {"id": content}
        }
    elif message_type == "document_id":  # cuando subes un documento a Meta y usas el id
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "document",
            "document": {
                "id": content,
                "filename": filename or "document.pdf",
                "caption": "Documento enviado"
            }
        }
    elif message_type == "audio_id":  # 🎵 NUEVO: cuando subes un audio a Meta y usas el id
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "audio",
            "audio": {"id": content}
        }
    else:
        raise ValueError("Tipo de mensaje no soportado")

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        return response.json()