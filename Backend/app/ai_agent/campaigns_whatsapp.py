# campaign_module.py
import os
import asyncio
from openai import OpenAI
from telegram import Bot
from telegram.error import TelegramError

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = 1885202056

openai = OpenAI(api_key=OPENAI_KEY)
bot = Bot(token=TELEGRAM_TOKEN)

async def generate_campaign_text(prompt: str) -> str:
    system_msg = (
        "Eres un experto en marketing digital que crea textos profesionales, "
        "atractivos y efectivos para campañas de WhatsApp. "
        "Céntrate en persuadir y captar la atención, con un lenguaje claro y amigable."
    )
    try:
        # Ejecuta la llamada síncrona en thread para no bloquear
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
        
        result = await asyncio.to_thread(call_openai)
        return result
    except Exception as e:
        return f"Error generando texto: {e}"

async def send_telegram_message(text: str, image_path: str = None) -> bool:
    try:
        if image_path and os.path.isfile(image_path):
            with open(image_path, "rb") as img:
                await bot.send_photo(chat_id=TELEGRAM_CHAT_ID, photo=img, caption=text)
        else:
            await bot.send_message(chat_id=TELEGRAM_CHAT_ID, text=text)
        return True
    except TelegramError as e:
        print(f"Error enviando mensaje Telegram: {e}")
        return False

async def create_and_send_campaign(prompt: str, image_path: str = None) -> dict:
    campaign_text = await generate_campaign_text(prompt)
    success = await send_telegram_message(campaign_text, image_path)
    return {
        "success": success,
        "campaign_text": campaign_text
    }

