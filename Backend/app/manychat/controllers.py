import os
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

MANYCHAT_API_KEY = os.getenv("MANYCHAT_API_KEY")

async def get_subscribers_by_custom_field(field: str, value: str):
    """
    Llama al endpoint de ManyChat para obtener suscriptores según campo personalizado.
    Ejemplo: /fb/subscriber/findByCustomField?field=country&value=Mexico
    """
    url = f"https://api.manychat.com/fb/subscriber/findByCustomField?field={field}&value={value}"
    headers = {
        "Authorization": f"Bearer {MANYCHAT_API_KEY}",
        "accept": "application/json"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)

            if response.status_code == 405:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Method Not Allowed",
                        "api_message": response.json().get("message", "Unknown error"),
                        "solution": "Verifica que estés usando el endpoint y método HTTP correctos"
                    }
                )

            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "api_status_code": e.response.status_code,
                "message": str(e),
                "response_text": e.response.text
            }
        )

async def get_subscriber_info(subscriber_id: str):
    """
    Obtiene información detallada de un suscriptor específico por ID
    """
    url = f"https://api.manychat.com/fb/subscriber/getInfo?subscriber_id={subscriber_id}"
    headers = {
        "Authorization": f"Bearer {MANYCHAT_API_KEY}",
        "accept": "application/json"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "api_status_code": e.response.status_code,
                "message": str(e),
                "response_text": e.response.text
            }
        )
 