from fastapi import APIRouter, Request, Query, Response
from app.database.mongo import messages_collection
from app.websocket.routes import notify_all
from datetime import datetime
import pytz
import os
from dotenv import load_dotenv
import json

load_dotenv()
router = APIRouter()


def save_message(sender_id: str, platform: str, text: str, direction: str = "inbound"):
    """
    Guarda un mensaje estructurado en la base de datos.
    """
    message = {
        "sender_id": sender_id,
        "platform": platform,
        "text": text,
        "timestamp": datetime.utcnow().isoformat(),
        "direction": direction,
        "conversation_id": sender_id  # puedes usar el sender como ID de conversación
    }
    messages_collection.insert_one(message)

@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    """
    Verifica el webhook con Meta para cualquier producto (WhatsApp, Instagram, Facebook).
    """
    VERIFY_TOKEN = os.getenv("VERIFY_TOKEN", "my_verify_token")
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return Response(content=hub_challenge or "", media_type="text/plain")
    return {"error": "Verification failed"}

@router.post("/webhook")
async def meta_webhook(request: Request):
    body = await request.json()
    print("🔔 Webhook recibido:", json.dumps(body, indent=2))

    try:
        messages_collection.insert_one({"raw": body})  # Opcional: debug/log
    except Exception:
        pass

    # 🔄 Notifica por WebSocket a todos los conectados
    await notify_all(json.dumps(body))

    object_type = body.get("object", "")
    if "entry" not in body:
        return {"status": "no_entry"}

    for entry in body["entry"]:

        # 📲 WHATSAPP
        if "changes" in entry:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                metadata = value.get("metadata", {})
                for msg in value.get("messages", []):
                    wa_id = msg.get("from")
                    text = msg.get("text", {}).get("body", "")
                    profile_name = value.get("contacts", [{}])[0].get("profile", {}).get("name", "")
                    timestamp = datetime.now(pytz.timezone('America/Bogota'))

                    # Mantengo tu código intacto
                    new_message = {
                        "sender": "user",
                        "content": text,    
                        "timestamp": timestamp
                    }
                    # Creo un objeto extendido para enviar por WebSocket
                    ws_message = {
                        "user_id": wa_id,
                        "conversation_id": wa_id,
                        "platform": "whatsapp",
                        "text": text,
                        "timestamp": timestamp.isoformat(),
                        "direction": "inbound",
                        "remitente": profile_name or wa_id
                    }
                    # Guardo en la base de datos
                    messages_collection.update_one(
                        {"user_id": wa_id, "platform": "whatsapp"},
                        {
                            "$set": {
                                "name": profile_name,
                                "last_message": text,
                                "timestamp": timestamp
                            },
                            "$inc": {"unread": 1},
                            "$push": {"messages": new_message}
                        },
                        upsert=True
                    )
                    print(f"[WhatsApp] {profile_name or wa_id}: {text}")
                    # Enviar por WebSocket el mensaje extendido
                    await notify_all(ws_message)

        # 💬 FACEBOOK MESSENGER
        if object_type == "page" and "messaging" in entry:
            for event in entry.get("messaging", []):
                sender_id = event.get("sender", {}).get("id")
                message_text = event.get("message", {}).get("text", "")
                timestamp = datetime.utcnow()

                if sender_id and message_text:
                    new_message = {
                        "sender": "user",
                        "content": message_text,
                        "timestamp": timestamp
                    }

                    messages_collection.update_one(
                        {"user_id": sender_id, "platform": "messenger"},
                        {
                            "$set": {
                                "name": None,
                                "last_message": message_text,
                                "timestamp": timestamp
                            },
                            "$inc": {"unread": 1},
                            "$push": {"messages": new_message}
                        },
                        upsert=True
                    )
                    print(f"[Messenger] {sender_id}: {message_text}")

        # 📷 INSTAGRAM
        if object_type == "instagram":
            messaging_events = entry.get("messaging", []) or entry.get("standby", [])
            for event in messaging_events:
                sender_id = event.get("sender", {}).get("id")
                message_text = event.get("message", {}).get("text", "")
                timestamp = datetime.utcnow()

                if sender_id and message_text:
                    new_message = {
                        "sender": "user",
                        "content": message_text,
                        "timestamp": timestamp
                    }

                    messages_collection.update_one(
                        {"user_id": sender_id, "platform": "instagram"},
                        {
                            "$set": {
                                "name": None,
                                "last_message": message_text,
                                "timestamp": timestamp
                            },
                            "$inc": {"unread": 1},
                            "$push": {"messages": new_message}
                        },
                        upsert=True
                    )

                    print(f"[Instagram] {sender_id}: {message_text}")

    return {"status": "received"}



 