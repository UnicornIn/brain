from fastapi import APIRouter, HTTPException
from app.database.mongo import contacts_collection, messages_collection
from datetime import datetime, timedelta
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


# --- Función para filtrar mensajes duplicados de Instagram EN MEMORIA ---
def filter_instagram_duplicates_in_memory(messages: list):
    """Filtra mensajes duplicados de Instagram solo en memoria, sin borrar de BD"""
    if not messages:
        return messages
        
    seen_messages = set()
    unique_messages = []
    duplicates_count = 0
    
    for msg in messages:
        content = msg.get("content", "")
        sender = msg.get("sender", "")
        timestamp = msg.get("timestamp", "")
        
        # Crear clave única basada en contenido, sender y timestamp (con margen de 5 segundos)
        if timestamp:
            try:
                # Parsear timestamp y redondear a 5 segundos
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                rounded_seconds = (dt.second // 5) * 5
                timestamp_key = dt.replace(second=rounded_seconds, microsecond=0).isoformat()
            except:
                timestamp_key = timestamp[:19]  # Usar solo hasta segundos si hay error
        else:
            timestamp_key = ""
            
        message_key = f"{content}|{sender}|{timestamp_key}"
        
        if message_key in seen_messages:
            duplicates_count += 1
            print(f"🔍 Duplicado filtrado en memoria: {content}")
        else:
            seen_messages.add(message_key)
            unique_messages.append(msg)
    
    if duplicates_count > 0:
        print(f"✅ Filtrados {duplicates_count} mensajes duplicados de Instagram (solo en memoria)")
    
    return unique_messages


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
        
        # Limpiar todos los mensajes
        cleaned_messages = [clean_mongo_doc(m) for m in all_messages]
        
        # ✅ SOLO PARA INSTAGRAM: Filtrar duplicados EN MEMORIA (sin borrar de BD)
        if conv.get("platform") == "instagram":
            final_messages = filter_instagram_duplicates_in_memory(cleaned_messages)
            duplicates_removed = len(cleaned_messages) - len(final_messages)
        else:
            final_messages = cleaned_messages
            duplicates_removed = 0

        response = {
            "user_id": user_id,
            "name": conv.get("name", ""),
            "platform": conv.get("platform", ""),
            "last_message": final_messages[-1]["content"] if final_messages else "",
            "timestamp": final_messages[-1]["timestamp"] if final_messages else "",
            "pretty_time": final_messages[-1].get("timestamp_pretty") if final_messages else "",
            "unread": conv.get("unread", 0),
            "messages": [
                {
                    "sender": m.get("sender", ""),
                    "content": m.get("content", ""),
                    "timestamp": m.get("timestamp"),
                    "pretty_time": m.get("timestamp_pretty", "")
                }
                for m in final_messages
            ],
            "total_messages": len(final_messages),
            "duplicates_removed": duplicates_removed
        }

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


# --- Endpoint adicional para ver duplicados sin eliminarlos ---
@router.get("/conversations/check-duplicates/{user_id}")
async def check_duplicates(user_id: str):
    """Endpoint para verificar duplicados sin eliminarlos"""
    try:
        conv = await contacts_collection.find_one({"user_id": user_id})
        if not conv:
            raise HTTPException(status_code=404, detail="No se encontró conversación para este usuario.")
        
        msgs_cursor = messages_collection.find({"conversation_id": conv["_id"]}).sort("timestamp", 1)
        all_messages = await msgs_cursor.to_list(length=None)
        cleaned_messages = [clean_mongo_doc(m) for m in all_messages]
        
        if conv.get("platform") == "instagram":
            final_messages = filter_instagram_duplicates_in_memory(cleaned_messages)
            duplicates_count = len(cleaned_messages) - len(final_messages)
        else:
            final_messages = cleaned_messages
            duplicates_count = 0
        
        return {
            "status": "success",
            "user_id": user_id,
            "platform": conv.get("platform", ""),
            "total_messages_in_db": len(all_messages),
            "duplicates_detected": duplicates_count,
            "unique_messages_to_display": len(final_messages),
            "message": f"Se detectaron {duplicates_count} duplicados (solo en visualización)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verificando duplicados: {str(e)}")


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