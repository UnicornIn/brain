# app/subscribers/controller.py
import os
import httpx
from dotenv import load_dotenv
import uuid

load_dotenv()

MANYCHAT_API_KEY = os.getenv("MANYCHAT_API_KEY")

async def get_subscriber_info(subscriber_id: int):
    url = f"https://api.manychat.com/fb/subscriber/getInfo?subscriber_id={subscriber_id}"
    headers = {
        "Authorization": f"Bearer {MANYCHAT_API_KEY}",
        "accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        return response.json()
