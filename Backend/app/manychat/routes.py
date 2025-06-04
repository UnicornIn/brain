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

    subscriber_data = data["data"]

    # 2. Determinar plataforma y canal
    canal = "facebook"
    numero = None

    if subscriber_data.get("tt_username"):
        canal = "tiktok"
    elif subscriber_data.get("ig_username"):
        canal = "instagram"
    elif subscriber_data.get("whatsapp_phone"):
        canal = "whatsapp"
        numero = subscriber_data["whatsapp_phone"]

    # 3. Preparar estructura de contacto
    contact_doc = {
        "subscriber_id": str(subscriber_data["id"]),
        "canal": canal,
        "created_at": datetime.utcnow(),
        "last_updated": datetime.utcnow(),
        "numero": numero,
        "info": {}
    }

    # Copiar campos relevantes a "info"
    campos_info = [
        "first_name", "last_name", "phone", "email", "custom_fields",
        "tags", "gender", "locale", "timezone", "subscribed", "last_seen",
        "status", "live_chat_url", "tt_username", "tt_user_id",
        "ig_username", "ig_id", "ig_last_interaction", "page_id",
        "profile_pic", "last_interaction", "optin_whatsapp"
    ]
    for campo in campos_info:
        if campo in subscriber_data:
            contact_doc["info"][campo] = subscriber_data[campo]

    # 4. Verificar si ya existe contacto (para conservar created_at y unique_id)
    existing = await contacts_collection.find_one({"subscriber_id": contact_doc["subscriber_id"]})
    if existing:
        contact_doc["created_at"] = existing["created_at"]
        contact_doc["unique_id"] = existing.get("unique_id")  # conservar el ID si ya existe
    else:
        # Generar nuevo unique_id solo si no existe
        count = await contacts_collection.count_documents({})
        nuevo_id = str(count + 1).zfill(2)  # convierte 1 → '01', 12 → '12'
        contact_doc["unique_id"] = nuevo_id
        print(f"🆕 Asignado unique_id: {nuevo_id}")

    # 5. Guardar en MongoDB
    try:
        print("Intentando guardar en MongoDB...")
        result = await contacts_collection.update_one(
            {"subscriber_id": contact_doc["subscriber_id"]},
            {"$set": contact_doc},
            upsert=True
        )

        if result.acknowledged:
            if result.upserted_id:
                print(f"✅ Nuevo registro creado (ID: {result.upserted_id})")
                accion = "created"
            elif result.modified_count > 0:
                print("✔ Registro actualizado")
                accion = "updated"
            else:
                print("⚠ Datos sin cambios")
                accion = "no_change"
        else:
            raise HTTPException(status_code=500, detail="MongoDB no confirmó la operación")

    except Exception as e:
        print(f"❌ Error grave: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")

    # 6. Respuesta
    print("=== Proceso completado ===")
    return {
        "status": "success",
        "message": "Contacto guardado correctamente",
        "details": {
            "subscriber_id": contact_doc["subscriber_id"],
            "canal": contact_doc["canal"],
            "numero": contact_doc.get("numero"),
            "unique_id": contact_doc.get("unique_id"),
            "accion": accion,
            "timestamp": contact_doc["last_updated"].isoformat()
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

