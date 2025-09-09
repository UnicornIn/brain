from fastapi import APIRouter, HTTPException
from app.database.mongo import conversations_collection, messages_collection
from datetime import datetime
from bson import ObjectId

router = APIRouter()


@router.get("/get-conversations/")
async def get_all_conversations():
    """
    Retorna todas las conversaciones con la misma estructura que espera el front.
    Aunque los mensajes se guardan en otra colección, aquí se agrupan.
    """
    conversations_cursor = conversations_collection.find().sort("timestamp", -1).limit(100)
    results = []

    async for conv in conversations_cursor:
        if "_id" in conv and isinstance(conv["_id"], ObjectId):
            conv["_id"] = str(conv["_id"])

        user_id = conv.get("user_id")
        if not user_id:
            continue

        # Buscar los mensajes asociados a esta conversación
        msgs_cursor = messages_collection.find({"conversation_id": conv["_id"]}).sort("timestamp", 1)
        all_messages = await msgs_cursor.to_list(length=None)

        # Normalizar timestamps
        for msg in all_messages:
            ts = msg.get("timestamp")
            if isinstance(ts, datetime):
                msg["timestamp"] = ts.isoformat()

        # Último mensaje
        last_message = all_messages[-1]["content"] if all_messages else ""
        latest_timestamp = all_messages[-1]["timestamp"] if all_messages else None

        pretty_time = ""
        if isinstance(latest_timestamp, str):
            try:
                dt = datetime.fromisoformat(latest_timestamp.replace("Z", "+00:00"))
                pretty_time = dt.strftime("%Y-%m-%d %H:%M:%S")
            except Exception:
                pretty_time = latest_timestamp

        results.append({
            "_id": conv["_id"],
            "user_id": user_id,
            "name": conv.get("name", "Desconocido"),
            "platform": conv.get("platform", ""),
            "platform_icon": "🟢" if conv.get("platform") == "whatsapp" else "📘",
            "last_message": last_message,
            "timestamp": latest_timestamp,
            "pretty_time": pretty_time,
            "unread": conv.get("unread", 0),
            "estado": "Pendiente",
            "messages": all_messages
        })

    results.sort(key=lambda r: r.get("timestamp") or "", reverse=True)

    return results


@router.get("/conversations/messages/{user_id}")
async def get_messages_by_user(user_id: str):
    """
    Retorna todos los mensajes de un usuario como una sola conversación.
    Se arma igual a como lo espera el front.
    """
    try:
        # Buscar la conversación
        conv = await conversations_collection.find_one({"user_id": user_id})
        if not conv:
            raise HTTPException(status_code=404, detail="No se encontró conversación para este usuario.")

        # Buscar mensajes
        msgs_cursor = messages_collection.find({"conversation_id": str(conv["_id"])}).sort("timestamp", 1)
        all_messages = await msgs_cursor.to_list(length=None)

        # Normalizar
        for msg in all_messages:
            ts = msg.get("timestamp")
            if isinstance(ts, datetime):
                msg["timestamp"] = ts.isoformat()

        response = {
            "user_id": user_id,
            "name": conv.get("name", ""),
            "platform": conv.get("platform", ""),
            "last_message": all_messages[-1]["content"] if all_messages else "",
            "timestamp": all_messages[-1]["timestamp"] if all_messages else "",
            "unread": conv.get("unread", 0),
            "messages": [
                {
                    "sender": m.get("sender", ""),
                    "content": m.get("content", ""),
                    "timestamp": m.get("timestamp")
                }
                for m in all_messages
            ]
        }

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
