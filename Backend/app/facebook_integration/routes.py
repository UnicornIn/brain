from fastapi import APIRouter, HTTPException, Query
from app.facebook_integration.controllers import send_messenger_message, get_messenger_user_name
from app.facebook_integration.models import MessengerSendMessage
from app.database.mongo import contacts_collection, messages_collection
from app.websocket.routes import notify_all
from datetime import datetime, timezone
import httpx
import pytz
from bson import ObjectId
import os
from pydantic import BaseModel
from typing import List, Any, Tuple

router = APIRouter()

PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN")
bogota_tz = pytz.timezone("America/Bogota")


def utc_now():
    return datetime.now(timezone.utc)


def _parse_meta_response(resp: Any) -> Tuple[bool, int, dict]:
    """
    Normaliza la respuesta de la llamada a Meta (puede ser httpx.Response o dict).
    Retorna (ok_bool, status_code, data_dict)
    """
    # httpx / requests response-like
    if hasattr(resp, "status_code"):
        status = getattr(resp, "status_code", 500)
        try:
            data = resp.json()
        except Exception:
            data = {}
        ok = 200 <= status < 300
        return ok, status, data

    # dict already parsed
    if isinstance(resp, dict):
        data = resp
        # consider success if contains these common keys
        if any(k in data for k in ("message_id", "recipient_id", "id")) and not data.get("error"):
            return True, 200, data
        # otherwise treat as error
        return False, 500, data

    # unknown
    return False, 500, {"error": "unknown_response", "raw": str(resp)}


# --- Utilidad para limpiar documentos de Mongo (opcional) ---
def clean_mongo_doc(doc: dict) -> dict:
    from bson import ObjectId as _OID
    clean = {}
    for k, v in doc.items():
        if isinstance(v, _OID):
            clean[k] = str(v)
        elif isinstance(v, datetime):
            if v.tzinfo is not None:
                bogota_time = v.astimezone(bogota_tz)
            else:
                utc_time = v.replace(tzinfo=pytz.UTC)
                bogota_time = utc_time.astimezone(bogota_tz)
            clean[k] = bogota_time.isoformat()
            clean[f"{k}_pretty"] = bogota_time.strftime("%Y-%m-%d %H:%M:%S")
        else:
            clean[k] = v
    return clean


@router.post("/messenger/send")
async def send_facebook_message(payload: MessengerSendMessage):
    """
    Enviar mensaje a un usuario de Messenger:
    - Llama a la API de Facebook (controller)
    - Asegura conversation_id único por contacto
    - Actualiza contact
    - Guarda en messages_collection
    - Notifica por WebSocket
    """
    try:
        # 1) Llamar controlador
        response = await send_messenger_message(payload.data.user_id, payload.data.text)

        ok, status_code, data = _parse_meta_response(response)
        if not ok:
            raise HTTPException(status_code=status_code, detail=f"Error enviando mensaje a Messenger: {data}")

        now_utc = utc_now()
        last_message = payload.data.text
        user_id = payload.data.user_id

        # 2) Obtener contacto y conversation_id (reusar si existe)
        contact = await contacts_collection.find_one({"user_id": user_id, "platform": "messenger"})
        
        if contact:
            conversation_id = str(contact["_id"])
        else:
            new_contact_id = ObjectId()
            conversation_id = str(new_contact_id)

        # 3) Nombre de contacto
        nombre_contacto = await get_messenger_user_name(user_id) or "Cliente"

        # 4) Actualizar/crear contacto
        await contacts_collection.find_one_and_update(
            {"user_id": user_id, "platform": "messenger"},
            {
                "$set": {
                    "last_message": last_message,
                    "timestamp": now_utc,
                    "name": nombre_contacto,
                    "conversation_id": conversation_id,
                    "unread": 0
                }
            },
            upsert=True
        )

        # 5) Guardar en messages_collection
        message_doc = {
            "conversation_id": conversation_id,
            "sender": "system",
            "type": "text",
            "content": last_message,
            "timestamp": now_utc,
        }
        await messages_collection.insert_one(message_doc)

        # 6) 🔥 CORREGIDO: Notificar frontend - Mismo formato que WhatsApp
        ws_message = {
            "user_id": user_id,
            "conversation_id": conversation_id,
            "platform": "messenger",  # Mantener como "messenger"
            "text": last_message,  # Usar "text" igual que WhatsApp
            "timestamp": now_utc.isoformat(),
            "direction": "outbound",  # Esto es clave
            "remitente": nombre_contacto,  # Usar el nombre real
            "message_id": f"msg_{conversation_id}_{int(now_utc.timestamp())}"
        }
        
        print(f"📤 Enviando por WebSocket: {ws_message}")
        await notify_all(ws_message)

        return {
            "status": "sent",
            "facebook_status": status_code,
            "facebook_response": data,
            "conversation_id": conversation_id
        }

    except Exception as e:
        print(f"❌ Error en /messenger/send: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

    