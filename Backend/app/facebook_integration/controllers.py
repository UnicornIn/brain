import httpx
import os
from fastapi import HTTPException, UploadFile
import json

PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN")

if not PAGE_ACCESS_TOKEN:
    raise RuntimeError("PAGE_ACCESS_TOKEN no está configurado en las variables de entorno.")


# --- Enviar mensaje de texto ---
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
    headers = {"Content-Type": "application/json"}

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


# --- Obtener nombre de usuario ---
async def get_messenger_user_name(psid: str) -> dict:
    url = f"https://graph.facebook.com/v19.0/{psid}"
    params = {
        "fields": "first_name,last_name,profile_pic",
        "access_token": PAGE_ACCESS_TOKEN
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            return {
                "name": f"{data.get('first_name', '')} {data.get('last_name', '')}".strip(),
                "profile_pic": data.get("profile_pic")
            }
        else:
            print("Error al obtener nombre:", response.status_code, response.text)
            return {"name": "Desconocido", "profile_pic": None}


# --- Enviar imagen desde URL ---
async def send_messenger_image(user_id: str, image_url: str):
    """
    Envía una imagen a un usuario de Messenger como mensaje simple.
    image_url puede ser cualquier URL pública de imagen o Facebook.
    """
    url = f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
    payload = {
        "recipient": {"id": user_id},
        "message": {
            "attachment": {
                "type": "image",
                "payload": {"url": image_url, "is_reusable": True}
            }
        },
        "messaging_type": "RESPONSE"
    }
    headers = {"Content-Type": "application/json"}

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code != 200:
        print("❌ Error al enviar imagen a Messenger:", response.status_code, response.text)
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Error al enviar imagen: {response.text}"
        )

    print("📤 Imagen enviada a Messenger:", response.status_code, response.text)
    return response.json()


# --- Subir imagen local y enviar ---
async def upload_and_send_messenger_image(user_id: str, file: UploadFile):
    """
    Recibe un UploadFile desde FastAPI, sube a Messenger y envía el mensaje.
    """
    file_content = await file.read()

    # 1️⃣ Subir imagen a Messenger y obtener attachment_id
    url_upload = f"https://graph.facebook.com/v19.0/me/message_attachments?access_token={PAGE_ACCESS_TOKEN}"
    payload = {
        "message": json.dumps({"attachment": {"type": "image", "payload": {}}})
    }
    files = {"filedata": (file.filename, file_content, file.content_type)}

    async with httpx.AsyncClient() as client:
        response = await client.post(url_upload, data=payload, files=files)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=f"Error al subir imagen: {response.text}")

    attachment_id = response.json().get("attachment_id")
    if not attachment_id:
        raise HTTPException(status_code=500, detail=f"No se obtuvo attachment_id: {response.json()}")

    # 2️⃣ Enviar mensaje con attachment_id
    url_send = f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
    payload_send = {
        "recipient": {"id": user_id},
        "message": {"attachment": {"type": "image", "payload": {"attachment_id": attachment_id}}},
        "messaging_type": "RESPONSE"
    }

    async with httpx.AsyncClient() as client:
        response_send = await client.post(url_send, json=payload_send)

    if response_send.status_code != 200:
        raise HTTPException(status_code=response_send.status_code, detail=f"Error al enviar imagen: {response_send.text}")

    return response_send.json()