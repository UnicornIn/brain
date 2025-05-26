from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.manychat.controllers import get_subscriber_info
from app.database.mongo import contacts_collection


router = APIRouter()

@router.get("/manychat/subscriber")
async def fetch_and_save_subscriber(subscriber_id: int):
    print("\n=== Iniciando proceso ===")
    print(f"Buscando suscriptor ID: {subscriber_id}")
    
    # 1. Obtener datos de ManyChat
    data = await get_subscriber_info(subscriber_id)
    print("Datos recibidos de ManyChat")
    
    if data.get("status") != "success" or not data.get("data"):
        print("❌ Error: Suscriptor no encontrado")
        raise HTTPException(status_code=404, detail="Subscriber not found")

    # 2. Procesar datos
    subscriber_data = data["data"]
    
    # Determinar la fuente principal y el identificador único
    source_system = "facebook"  # Valor por defecto
    unique_identifier = subscriber_data["id"]  # Usamos el ID de ManyChat como identificador para Facebook
    
    if subscriber_data.get("tt_username"):
        source_system = "tiktok"
        unique_identifier = subscriber_data["tt_username"]
    elif subscriber_data.get("ig_username"):
        source_system = "instagram"
        unique_identifier = subscriber_data["ig_username"]
    elif subscriber_data.get("whatsapp_phone"):
        source_system = "whatsapp"
        unique_identifier = subscriber_data["whatsapp_phone"]
    
    # Campos básicos para todos los usuarios
    contact_data = {
        "subscriber_id": subscriber_data["id"],
        "first_name": subscriber_data.get("first_name"),
        "last_name": subscriber_data.get("last_name"),
        "source_system": source_system,
        "unique_identifier": unique_identifier,
        "last_update": datetime.utcnow()
    }
    
    # Campos específicos de plataforma
    if source_system == "tiktok":
        contact_data.update({
            "tt_username": subscriber_data.get("tt_username"),
            "tt_user_id": subscriber_data.get("tt_user_id")
        })
    elif source_system == "instagram":
        contact_data.update({
            "ig_username": subscriber_data.get("ig_username"),
            "ig_id": subscriber_data.get("ig_id"),
            "ig_last_interaction": subscriber_data.get("ig_last_interaction")
        })
    elif source_system == "whatsapp":
        contact_data.update({
            "whatsapp_phone": subscriber_data.get("whatsapp_phone"),
            "optin_whatsapp": subscriber_data.get("optin_whatsapp", False)
        })
    else:  # Facebook
        contact_data.update({
            "page_id": subscriber_data.get("page_id"),
            "profile_pic": subscriber_data.get("profile_pic"),
            "last_interaction": subscriber_data.get("last_interaction")
        })
    
    # Campos opcionales para todos los usuarios
    optional_fields = [
        "phone", "email", "custom_fields", "tags", 
        "gender", "locale", "timezone", "subscribed",
        "last_seen", "status", "live_chat_url"
    ]
    
    for field in optional_fields:
        if field in subscriber_data:
            contact_data[field] = subscriber_data[field]
    
    print("✔ Datos preparados para MongoDB")

    # 3. Guardar en MongoDB
    try:
        print("Intentando guardar en MongoDB...")
        result = await contacts_collection.update_one(
            {"subscriber_id": contact_data["subscriber_id"]},
            {"$set": contact_data},
            upsert=True
        )
        
        if result.acknowledged:
            if result.upserted_id:
                print(f"✅ Nuevo registro creado en MongoDB (ID: {result.upserted_id})")
            elif result.modified_count > 0:
                print(f"✔ Registro actualizado en MongoDB (Modificados: {result.modified_count} campos)")
            else:
                print("⚠ Datos idénticos - No se requirieron cambios")
        else:
            print("❌ Error: MongoDB no confirmó la operación")
            raise HTTPException(status_code=500, detail="Error en base de datos")

    except Exception as e:
        print(f"❌ Error grave en MongoDB: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")

    # 4. Respuesta
    print("=== Proceso completado ===")
    return {
        "status": "success",
        "message": "Datos guardados correctamente",
        "details": {
            "subscriber_id": contact_data["subscriber_id"],
            "first_name": contact_data["first_name"],
            "source_system": source_system,
            "unique_identifier": unique_identifier,
            "stored_in_mongo": True,
            "action": "created" if result.upserted_id else "updated",
            "timestamp": contact_data["last_update"].isoformat()
        }
    }
    
# @router.get("/manychat/subscriber/conversation")
# async def save_subscriber_conversation(subscriber_id: int):
#     print("\n=== Iniciando proceso de guardar conversación ===")
#     print(f"Buscando suscriptor ID: {subscriber_id}")
    
#     # 1. Obtener datos de ManyChat
#     data = await get_subscriber_info(subscriber_id)
#     print("Datos recibidos de ManyChat")
    
#     if data.get("status") != "success" or not data.get("data"):
#         print("❌ Error: Suscriptor no encontrado")
#         raise HTTPException(status_code=404, detail="Subscriber not found")

#     subscriber_data = data["data"]
#     custom_fields = subscriber_data.get("custom_fields", [])
    
#     # 2. Extraer los campos personalizados específicos
#     def get_custom_field_value(fields, field_name: str) -> Optional[str]:
#         for field in fields:
#             if field.get("name") == field_name:
#                 return field.get("value")
#         return None
    
#     user_input = get_custom_field_value(custom_fields, "user_input")
#     assistant_message = get_custom_field_value(custom_fields, "mensajes_del_asistente")
    
#     if not user_input:
#         print("❌ Error: Campo 'user_input' no encontrado")
#         raise HTTPException(status_code=400, detail="Missing user_input field")
    
#     if not assistant_message:
#         print("❌ Error: Campo 'mensajes_del_asistente' no encontrado")
#         raise HTTPException(status_code=400, detail="Missing mensajes_del_asistente field")
    
#     # 3. Preparar datos para guardar
#     conversation_data = {
#         "subscriber_id": subscriber_data["id"],
#         "conversation_id": str(uuid.uuid4()),  # Generamos un ID único
#         "user_input": user_input,
#         "assistant_message": assistant_message,
#         "last_interaction": datetime.utcnow(),  # Fecha/hora actual cuando se guarda
#         "metadata": {
#             "source": "manychat",
#             "ig_username": subscriber_data.get("ig_username"),
#             "first_name": subscriber_data.get("first_name"),
#             "last_name": subscriber_data.get("last_name")
#         }
#     }
    
#     print("✔ Datos de conversación preparados para MongoDB")
#     print(f" - User Input: {user_input[:50]}...")
#     print(f" - Assistant Message: {assistant_message[:50]}...")

#     # 4. Guardar en MongoDB
#     try:
#         print("Intentando guardar conversación en MongoDB...")
#         result = await messages_collection.insert_one(conversation_data)
        
#         if result.acknowledged:
#             print(f"✅ Conversación guardada (ID: {result.inserted_id})")
#         else:
#             print("❌ Error: MongoDB no confirmó la operación")
#             raise HTTPException(status_code=500, detail="Error en base de datos")

#     except Exception as e:
#         print(f"❌ Error grave en MongoDB: {str(e)}")
#         raise HTTPException(status_code=500, detail="Database error")

#     # 5. Respuesta
#     print("=== Proceso completado ===")
#     return {
#         "status": "success",
#         "message": "Conversación guardada exitosamente",
#         "data": {
#             "conversation_id": conversation_data["conversation_id"],
#             "subscriber_id": conversation_data["subscriber_id"],
#             "last_interaction": conversation_data["last_interaction"].isoformat(),
#             "user_input": conversation_data["user_input"],
#             "assistant_message": conversation_data["assistant_message"],
#             "stored_in_mongo": True
#         }
#     }

