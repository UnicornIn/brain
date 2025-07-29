from fastapi import APIRouter, Request, Query, Response
from app.database import messages_collection
from app.websocket import notify_all
import os
from dotenv import load_dotenv
import json

load_dotenv()
router = APIRouter()

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
    """
    Recibe todos los eventos de Meta (WhatsApp, Instagram y Facebook Messenger).
    Detecta la plataforma según el contenido del JSON.
    """
    body = await request.json()
    print("🔔 Webhook recibido:", json.dumps(body, indent=2))

    # Guardar el evento crudo en la base de datos
    try:
        messages_collection.insert_one({"raw": body})
    except Exception:
        pass

    # Notificar a todos los clientes WebSocket conectados
    notify_all(json.dumps(body))

    # ----------------------------
    # Detectar la plataforma Meta
    # ----------------------------
    object_type = body.get("object", "")

    if "entry" in body:
        for entry in body["entry"]:
            # --- WhatsApp Business API ---
            if "changes" in entry:
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    for msg in value.get("messages", []):
                        wa_id = msg.get("from", "")
                        text = msg.get("text", {}).get("body", "")
                        print(f"[WhatsApp] Mensaje de {wa_id}: {text}")

            # --- Facebook Messenger ---
            if object_type == "page" and "messaging" in entry:
                for messaging_event in entry.get("messaging", []):
                    sender_id = messaging_event.get("sender", {}).get("id", "")
                    message_text = messaging_event.get("message", {}).get("text", "")
                    print(f"[Messenger] Mensaje de {sender_id}: {message_text}")

            # --- Instagram Messaging ---
            if object_type == "instagram":
                # Algunos eventos de Instagram llegan como entry.messaging o standby
                messaging_events = entry.get("messaging", []) or entry.get("standby", [])
                for event in messaging_events:
                    sender_id = event.get("sender", {}).get("id", "")
                    message_text = event.get("message", {}).get("text", "")
                    print(f"[Instagram] Mensaje de {sender_id}: {message_text}")

    return {"status": "received"}



