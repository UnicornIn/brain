import httpx
import os

PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN")

async def get_instagram_username(user_id: str) -> str | None:
    url = f"https://graph.facebook.com/v19.0/{user_id}"
    params = {
        "fields": "username",
        "access_token": PAGE_ACCESS_TOKEN
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            return data.get("username")
        else:
            print("⚠️ Error consultando username:", response.text)
            return None

async def get_messenger_user(psid: str) -> dict | None:
    """
    Devuelve info básica de un usuario de Messenger a partir del PSID.
    Retorna dict con first_name, last_name, profile_pic.
    """
    url = f"https://graph.facebook.com/v20.0/{psid}"
    params = {
        "fields": "first_name,last_name,profile_pic",
        "access_token": PAGE_ACCESS_TOKEN
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            print("⚠️ Error consultando Messenger user:", response.text)
            return None

