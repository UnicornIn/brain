from fastapi import APIRouter, Query, HTTPException
from app.database.mongo import messages_collection
from typing import Optional
from datetime import datetime
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from bson.json_util import dumps
from pymongo import DESCENDING

router = APIRouter()

from collections import defaultdict


@router.get("/get-conversations/")
async def get_all_conversations():
    conversations_cursor = messages_collection.find().sort("timestamp", -1).limit(100)
    grouped = defaultdict(list)

    async for doc in conversations_cursor:
        if "_id" in doc and isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])

        user_id = doc.get("user_id")
        if not user_id:
            continue

        grouped[user_id].append(doc)

    results = []

    for user_id, docs in grouped.items():
        all_messages = []
        unread_total = 0
        name = ""
        platform = ""
        latest_timestamp: Optional[datetime] = None
        last_message = ""

        for doc in docs:
            name = (doc.get("name") or name or "Desconocido").title()
            platform = doc.get("platform", platform)
            unread_total += doc.get("unread", 0)

            for msg in doc.get("messages", []):
                ts = msg.get("timestamp")
                if isinstance(ts, datetime):
                    msg["timestamp"] = ts.isoformat()
                all_messages.append(msg)

        all_messages.sort(key=lambda m: m.get("timestamp") or "", reverse=False)

        if all_messages:
            last_msg = all_messages[-1]
            last_message = last_msg.get("content", "")
            latest_timestamp = last_msg.get("timestamp")

        pretty_time = ""
        if isinstance(latest_timestamp, datetime):
            pretty_time = latest_timestamp.strftime("%Y-%m-%d %H:%M:%S")
            latest_timestamp = latest_timestamp.isoformat()
        elif isinstance(latest_timestamp, str):
            try:
                dt = datetime.fromisoformat(latest_timestamp.replace("Z", "+00:00"))
                pretty_time = dt.strftime("%Y-%m-%d %H:%M:%S")
            except Exception:
                pretty_time = latest_timestamp

        results.append({
            "_id": str(docs[0].get("_id")),
            "user_id": user_id,
            "name": name,
            "platform": platform,
            "platform_icon": "🟢" if platform == "whatsapp" else "📘",  # puedes cambiar esto según tus plataformas
            "last_message": last_message,
            "timestamp": latest_timestamp,
            "pretty_time": pretty_time,
            "unread": unread_total,
            "estado": "Pendiente",
            "messages": all_messages
        })

    results.sort(key=lambda r: r.get("timestamp") or "", reverse=True)

    return results

@router.get("/conversations/messages/{user_id}")
async def get_messages_by_user(user_id: str):
    """
    Retorna todos los mensajes del usuario identificado por user_id como una sola conversación agrupada.
    """
    try:
        cursor = messages_collection.find({"user_id": user_id})
        docs = await cursor.to_list(length=None)

        if not docs:
            raise HTTPException(status_code=404, detail="No se encontraron mensajes para este usuario.")

        # Combinar todos los mensajes de los documentos
        all_messages = []
        for doc in docs:
            all_messages.extend(doc.get("messages", []))

        # Ordenar los mensajes por timestamp
        all_messages.sort(key=lambda m: m.get("timestamp"))

        # Armar la conversación final
        response = {
            "user_id": user_id,
            "name": docs[0].get("name", ""),
            "platform": docs[0].get("platform", ""),
            "last_message": all_messages[-1].get("content", "") if all_messages else "",
            "timestamp": all_messages[-1].get("timestamp") if all_messages else "",
            "unread": sum(doc.get("unread", 0) for doc in docs),
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



