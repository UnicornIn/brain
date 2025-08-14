from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, timedelta
from typing import Optional
from app.database.mongo import message_collection, contacts_collection
from app.manychat.controllers import get_subscriber_info

router = APIRouter()

async def process_new_contacts():
    """Procesa nuevos contactos y los guarda en la base de datos"""
    contactos_nuevos = []
    processed_ids = set()
    
    async for message in message_collection.find().sort("timestamp", -1):
        try:
            subscriber_id = message.get("subscriber_id")
            if not subscriber_id or subscriber_id in processed_ids:
                continue

            processed_ids.add(subscriber_id)
            
            # Verificar si el contacto ya existe
            existe = await contacts_collection.find_one({"subscriber_id": subscriber_id})
            if existe:
                continue

            # Obtener info desde ManyChat
            subscriber_info = await get_subscriber_info(subscriber_id)
            if not subscriber_info or "data" not in subscriber_info or not subscriber_info["data"]:
                continue

            # Procesar datos del contacto
            contacto = await create_contact_from_message(message, subscriber_info["data"])
            if contacto:
                await contacts_collection.insert_one(contacto)
                contactos_nuevos.append(contacto)
                print(f"Nuevo contacto guardado: {subscriber_id}")

        except Exception as e:
            print(f"Error procesando mensaje {message.get('_id')}: {str(e)}")
            continue

    return contactos_nuevos

async def create_contact_from_message(message, subscriber_data):
    """Crea un objeto contacto a partir de un mensaje y datos de ManyChat"""
    subscriber_id = message.get("subscriber_id")
    if not subscriber_id:
        return None

    # Filtrar datos nulos/vacíos
    subscriber_data = {
        k: v for k, v in subscriber_data.items() 
        if v is not None and v != ""
    }

    # Determinar canal y otros identificadores
    identifiers = message.get("user_identifiers", {})
    canal_data = determine_channel(identifiers, subscriber_data, message)

    # Generar unique_id
    existing = await contacts_collection.find_one({"subscriber_id": subscriber_id})
    if existing and "unique_id" in existing:
        unique_id = existing["unique_id"]
    else:
        total_contacts = await contacts_collection.count_documents({})
        unique_id = str(total_contacts + 1).zfill(2)  # genera IDs tipo "01", "02", ..., "100"
        print(f"🆕 Generado unique_id automático: {unique_id}")

    # Estructurar contacto
    contacto = {
        "subscriber_id": subscriber_id,
        "canal": canal_data["canal"],
        "created_at": datetime.utcnow(),
        "last_updated": datetime.utcnow(),
        "unique_id": unique_id,
        **({"numero": canal_data["numero"]} if canal_data["numero"] else {}),
        **({"nombre_cuenta": canal_data["nombre_cuenta"]} if canal_data["nombre_cuenta"] else {}),
        "info": subscriber_data,
    }

    return contacto

def determine_channel(identifiers, subscriber_data, message):
    """Determina el canal y los identificadores del contacto"""
    canal_data = {
        "canal": "desconocido",
        "numero": "",
        "nombre_cuenta": ""
    }

    if "whatsappphone" in identifiers:
        canal_data.update({
            "canal": "whatsapp",
            "numero": identifiers["whatsappphone"]
        })
    elif "ig" in identifiers:
        canal_data.update({
            "canal": "instagram",
            "nombre_cuenta": identifiers["ig"]
        })
    elif "tt" in identifiers:
        canal_data.update({
            "canal": "tiktok",
            "nombre_cuenta": identifiers["tt"]
        })
    elif "gender" in subscriber_data:
        canal_data["canal"] = "facebook"
    else:
        canal_data["canal"] = message.get("channel", "desconocido")

    return canal_data

@router.get("/contacts/info")
async def get_all_contacts_info(
    skip: int = Query(0, ge=0, description="Número de documentos a saltar"),
    limit: int = Query(10, le=100, description="Número máximo de documentos a devolver"),
    canal: Optional[str] = Query(None, description="Filtrar por canal (whatsapp, instagram, etc)"),
    search: Optional[str] = Query(None, description="Texto para buscar en nombres, números o cuentas"),
    last_hours: Optional[int] = Query(None, description="Filtrar contactos actualizados en las últimas X horas"),
    with_new: bool = Query(True, description="Incluir procesamiento de nuevos contactos")
):
    """
    Obtiene información de todos los contactos con opciones de filtrado y paginación.
    
    Procesa nuevos contactos de mensajes no registrados y devuelve los contactos existentes
    con posibilidad de filtrar por canal, texto de búsqueda y tiempo de actualización.
    """
    try:
        # Procesar nuevos contactos si se solicita
        nuevos_guardados = []
        if with_new:
            print("Procesando nuevos contactos...")
            nuevos_guardados = await process_new_contacts()
        
        # Construir consulta de filtrado
        query = {}
        
        if canal:
            query["canal"] = canal.lower()
            
        if search:
            query["$or"] = [
                {"info.first_name": {"$regex": search, "$options": "i"}},
                {"info.last_name": {"$regex": search, "$options": "i"}},
                {"numero": {"$regex": search, "$options": "i"}},
                {"nombre_cuenta": {"$regex": search, "$options": "i"}},
                {"info.whatsapp_phone": {"$regex": search, "$options": "i"}}
            ]
            
        if last_hours:
            cutoff_time = datetime.utcnow() - timedelta(hours=last_hours)
            query["last_updated"] = {"$gte": cutoff_time}
        
        # Obtener total de contactos que coinciden con los filtros
        total = await contacts_collection.count_documents(query)
        
        # Obtener contactos paginados
        contactos = []
        cursor = contacts_collection.find(query).skip(skip).limit(limit)
        
        async for contacto in cursor:
            contacto["_id"] = str(contacto["_id"])
            
            # Formatear fechas para mejor legibilidad
            if "created_at" in contacto:
                contacto["created_at"] = contacto["created_at"].isoformat()
            if "last_updated" in contacto:
                contacto["last_updated"] = contacto["last_updated"].isoformat()
                
            contactos.append(contacto)
        
        # Estadísticas por canal
        pipeline = [
            {"$group": {"_id": "$canal", "count": {"$sum": 1}}}
        ]
        stats_by_channel = {}
        async for stat in contacts_collection.aggregate(pipeline):
            stats_by_channel[stat["_id"]] = stat["count"]
        
        return {
            "total": total,
            "nuevos_guardados": len(nuevos_guardados),
            "contactos": contactos,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "has_more": skip + limit < total
            },
            "stats": {
                "by_channel": stats_by_channel,
                "total_channels": len(stats_by_channel)
            }
        }
        
    except Exception as e:
        print(f"Error en get_all_contacts_info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
