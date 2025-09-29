from fastapi import APIRouter, HTTPException
from app.database.mongo import contacts_collection, messages_collection
from datetime import datetime
from bson import ObjectId
import pytz

router = APIRouter()

# --- Utilidad para limpiar documentos de Mongo ---
def clean_mongo_doc(doc: dict) -> dict:
    """Convierte ObjectId y datetime en tipos serializables (str) y ajusta hora a Bogotá."""
    clean = {}
    bogota_tz = pytz.timezone("America/Bogota")

    for k, v in doc.items():
        if isinstance(v, ObjectId):
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


# --- Obtener todas las conversaciones (SOLO último mensaje) ---
@router.get("/get-conversations/")
async def get_all_conversations():
    conversations_cursor = contacts_collection.find().sort("timestamp", -1).limit(100)
    results = []
    async for conv in conversations_cursor:
        conv = clean_mongo_doc(conv)

        user_id = conv.get("user_id")
        if not user_id:
            continue

        # 🚀 Traer solo el último mensaje de esa conversación
        last_msg_doc = await messages_collection.find_one(
            {"conversation_id": conv["_id"]},
            sort=[("timestamp", -1)]
        )
        last_msg = clean_mongo_doc(last_msg_doc) if last_msg_doc else None

        results.append({
            "_id": conv["_id"],
            "user_id": user_id,
            "name": conv.get("name", "Desconocido"),
            "platform": conv.get("platform", ""),
            "platform_icon": "🟢" if conv.get("platform") == "whatsapp" else "📘",
            "last_message": last_msg.get("content") if last_msg else "",
            "timestamp": last_msg.get("timestamp") if last_msg else None,
            "pretty_time": last_msg.get("timestamp_pretty") if last_msg else "",
            "unread": conv.get("unread", 0),
            "estado": "Pendiente"
        })

    results.sort(key=lambda r: r.get("timestamp") or "", reverse=True)
    return results


# --- Obtener todos los mensajes de una conversación específica ---
@router.get("/conversations/messages/{user_id}")
async def get_messages_by_user(user_id: str):
    try:
        conv = await contacts_collection.find_one({"user_id": user_id})
        if not conv:
            raise HTTPException(status_code=404, detail="No se encontró conversación para este usuario.")

        conv = clean_mongo_doc(conv)

        msgs_cursor = messages_collection.find({"conversation_id": conv["_id"]}).sort("timestamp", 1)
        all_messages = await msgs_cursor.to_list(length=None)
        all_messages = [clean_mongo_doc(m) for m in all_messages]

        response = {
            "user_id": user_id,
            "name": conv.get("name", ""),
            "platform": conv.get("platform", ""),
            "last_message": all_messages[-1]["content"] if all_messages else "",
            "timestamp": all_messages[-1]["timestamp"] if all_messages else "",
            "pretty_time": all_messages[-1].get("timestamp_pretty") if all_messages else "",
            "unread": conv.get("unread", 0),
            "messages": [
                {
                    "sender": m.get("sender", ""),
                    "content": m.get("content", ""),
                    "timestamp": m.get("timestamp"),
                    "pretty_time": m.get("timestamp_pretty", "")
                }
                for m in all_messages
            ]
        }

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


# --- Marcar contacto como gestionado ---
@router.post("/contacts/{contact_id}/gestionado")
async def marcar_gestionado(contact_id: str):
    result = await contacts_collection.update_one(
        {"_id": ObjectId(contact_id)},
        {"$set": {"gestionado": True}}
    )
    if result.modified_count == 1:
        return {"status": "ok", "contact_id": contact_id, "gestionado": True}
    return {"status": "not_found", "contact_id": contact_id}
