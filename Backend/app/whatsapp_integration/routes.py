from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from typing import Optional
from app.whatsapp_integration.controllers import send_whatsapp_message
from app.database.mongo import conversations_collection, messages_collection
from app.auth.jwt.jwt import get_current_user
from datetime import datetime
import os
import httpx
import pytz

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")

router = APIRouter()

@router.post("/whatsapp/send-message")
async def send_message(
    wa_id: str = Form(...),
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    user: dict = Depends(get_current_user(["admin"]))
):
    phone_number_id = os.getenv("WHATSAPP_PHONE_ID")

    if not phone_number_id:
        raise HTTPException(status_code=500, detail="WHATSAPP_PHONE_ID no configurado")

    try:
        tz_now = datetime.now(pytz.timezone("America/Bogota"))
        last_message = None
        msg_type = "text"
        content = None

        if image:
            # 📤 Subir la imagen a Facebook Graph API
            upload_url = f"https://graph.facebook.com/v19.0/{phone_number_id}/media"
            headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}

            files = {"file": (image.filename, await image.read(), image.content_type)}
            data = {"messaging_product": "whatsapp"}

            async with httpx.AsyncClient() as client:
                upload_res = await client.post(upload_url, headers=headers, data=data, files=files)
                upload_json = upload_res.json()

            if "id" not in upload_json:
                raise HTTPException(status_code=500, detail=f"Error subiendo imagen: {upload_json}")

            media_id = upload_json["id"]

            # 📩 Enviar el mensaje de tipo imagen
            result = await send_whatsapp_message(wa_id, media_id, phone_number_id, "image_id")

            last_message = "📎 Archivo"
            content = media_id
            msg_type = "image"

        elif text:
            # 📩 Enviar texto normal
            result = await send_whatsapp_message(wa_id, text, phone_number_id, "text")

            last_message = text
            content = text
            msg_type = "text"

        else:
            raise HTTPException(status_code=400, detail="Debe enviar texto o imagen")

        # 1️⃣ Asegurar conversación
        conv = await conversations_collection.find_one_and_update(
            {"user_id": wa_id, "platform": "whatsapp"},
            {
                "$set": {
                    "last_message": last_message,
                    "timestamp": tz_now,
                    "name": user["name"]
                }
            },
            upsert=True,
            return_document=True
        )

        # 2️⃣ Guardar mensaje como documento independiente
        new_message = {
            "conversation_id": str(conv["_id"]),
            "sender": "system",
            "name": user["name"],
            "type": msg_type,
            "content": content,
            "timestamp": tz_now
        }
        await messages_collection.insert_one(new_message)

        return {"status": "ok", "response": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


