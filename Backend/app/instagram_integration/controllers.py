# app/instagram_integration/controllers.py
import httpx
import os
from fastapi import HTTPException, UploadFile
import mimetypes

PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN")
if not PAGE_ACCESS_TOKEN:
    raise RuntimeError("❌ PAGE_ACCESS_TOKEN no está configurado en las variables de entorno.")


async def send_instagram_message(user_id: str, message: str):
    """Envía un mensaje de texto a un usuario de Instagram."""
    url = f"https://graph.facebook.com/v19.0/me/messages"
    payload = {
        "recipient": {"id": user_id},
        "message": {"text": message},
        "messaging_type": "RESPONSE"
    }
    params = {"access_token": PAGE_ACCESS_TOKEN}

    async with httpx.AsyncClient() as client:
        response = await client.post(url, params=params, json=payload)

    if response.status_code != 200:
        error_data = response.json().get('error', {})
        error_message = error_data.get('message', 'Error desconocido')
        error_code = error_data.get('code', 'N/A')
        raise HTTPException(status_code=response.status_code, detail=f"Error ({error_code}): {error_message}")

    return response


async def upload_instagram_media(file: UploadFile):
    """
    Sube un archivo a Meta para obtener attachment_id.
    Retorna el attachment_id.
    """
    try:
        content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
        file_content = await file.read()

        upload_url = f"https://graph.facebook.com/v19.0/me/message_attachments"

        files = {"filedata": (file.filename, file_content, content_type)}
        data = {
            "message": '{"attachment":{"type":"image","payload":{"is_reusable":true}}}',
            "access_token": PAGE_ACCESS_TOKEN
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(upload_url, data=data, files=files)
            res_json = res.json()

        if "attachment_id" not in res_json:
            error_msg = res_json.get('error', {}).get('message', 'Error desconocido al subir media')
            raise HTTPException(status_code=500, detail=f"Error subiendo media: {error_msg}")

        return res_json["attachment_id"]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en upload_instagram_media: {str(e)}")


async def send_instagram_image(user_id: str, file_or_url, is_url: bool = False):
    """
    Envía una imagen a un usuario de Instagram.
    - file_or_url: UploadFile si is_url=False, URL si is_url=True
    """
    try:
        url_api = f"https://graph.facebook.com/v19.0/me/messages"
        params = {"access_token": PAGE_ACCESS_TOKEN}

        if is_url:
            # Se envía usando la URL (desde S3)
            payload = {
                "recipient": {"id": user_id},
                "message": {
                    "attachment": {
                        "type": "image",
                        "payload": {
                            "url": file_or_url,
                            "is_reusable": True
                        }
                    }
                },
                "messaging_type": "RESPONSE"
            }
        else:
            # Se sube el archivo primero para obtener attachment_id
            attachment_id = await upload_instagram_media(file_or_url)
            payload = {
                "recipient": {"id": user_id},
                "message": {
                    "attachment": {
                        "type": "image",
                        "payload": {"attachment_id": attachment_id}
                    }
                },
                "messaging_type": "RESPONSE"
            }

        async with httpx.AsyncClient() as client:
            response = await client.post(url_api, params=params, json=payload)

        if response.status_code != 200:
            error_data = response.json().get('error', {})
            error_message = error_data.get('message', 'Error desconocido')
            error_code = error_data.get('code', 'N/A')
            raise HTTPException(status_code=response.status_code, detail=f"Error enviando imagen ({error_code}): {error_message}")

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en send_instagram_image: {str(e)}")
