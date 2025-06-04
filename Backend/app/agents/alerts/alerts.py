from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from app.database.mongo import messages_collection, alerts_collection
from app.agents.alerts.models import AlertResponse
from typing import List, Optional
from bson import ObjectId
from app.agents.alerts.models import AlertUpdate

from fastapi import status

router = APIRouter()

@router.post(
    "/generate-alerts",
    response_model=dict,
    summary="Genera alertas para mensajes pendientes",
)
async def generate_alerts():
    """
    Endpoint que busca mensajes con 'Un momento por favor.' y crea alertas correspondientes.
    """
    try:
        # 1. Configuración básica
        time_threshold = datetime.now() - timedelta(hours=24)

        # 2. Buscar mensajes pendientes
        query = {
            "assistant_response": {
                "$regex": r"^un momento por favor\.?",
                "$options": "i"
            },
            "last_interaction": {"$gte": time_threshold},
            "$or": [
                {"alert_created": {"$exists": False}},
                {"alert_created": False}
            ]
        }

        pending_messages = await messages_collection.find(query).to_list(length=None)

        # 3. Procesar mensajes
        new_alerts = []
        for msg in pending_messages:
            # Verificar si ya existe alerta
            existing_alert = await alerts_collection.find_one({
                "conversation_id": msg["conversation_id"],
                "status": {"$ne": "resolved"}
            })
            if existing_alert:
                continue

            # Crear nueva alerta
            alert_data = {
                "conversation_id": msg["conversation_id"],
                "subscriber_id": msg["subscriber_id"],
                "channel": msg["channel"],
                "user_message": msg["user_input"],
                "assistant_response": msg["assistant_response"],
                "contact_info": msg.get("user_identifiers", {}),
                "timestamp": msg["last_interaction"],
                "status": "pending",
                "created_at": datetime.now(),
                "metadata": msg.get("metadata", {})
            }
            new_alerts.append(alert_data)

            # Marcar mensaje como procesado
            await messages_collection.update_one(
                {"_id": msg["_id"]},
                {"$set": {"alert_created": True}}
            )

        # 4. Insertar alertas
        if new_alerts:
            await alerts_collection.insert_many(new_alerts)

        return {
            "status": "success",
            "message": "Proceso completado",
            "data": {
                "processed_messages": len(pending_messages),
                "new_alerts_created": len(new_alerts)
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar alertas: {str(e)}"
        ) 

@router.get("/alerts", response_model=List[AlertResponse])
async def list_alerts(
    status: Optional[str] = "pending",
    limit: int = 50,
    skip: int = 0
):
    """
    Lista todas las alertas con filtro por estado.
    
    Parámetros:
    - status: Estado de la alerta (pending, in_progress, resolved)
    - limit: Límite de resultados
    - skip: Saltar resultados (paginación)
    """
    try:
        query = {"status": status} if status else {}
        
        alerts = await alerts_collection.find(query)\
            .sort("timestamp", -1)\
            .skip(skip)\
            .limit(limit)\
            .to_list(length=None)
        
        # Convertir ObjectId a string y ajustar formato
        processed_alerts = []
        for alert in alerts:
            alert["id"] = str(alert["_id"])
            del alert["_id"]
            processed_alerts.append(alert)
        
        return processed_alerts
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar alertas: {str(e)}"
        )
        
@router.patch("/alerts/{alert_id}", response_model=AlertResponse)
async def update_alert_status(
    alert_id: str,
    update_data: AlertUpdate
):
    """
    Actualiza el estado de una alerta específica.
    
    Parámetros:
    - alert_id: ID de la alerta a actualizar
    - update_data: Nuevo estado (pending, in_progress, resolved)
    """
    try:
        if not ObjectId.is_valid(alert_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID de alerta inválido"
            )
        
        # Validar estados permitidos
        valid_statuses = ["pending", "in_progress", "resolved"]
        if update_data.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado inválido. Use uno de: {', '.join(valid_statuses)}"
            )
        
        update_result = await alerts_collection.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": {
                "status": update_data.status,
                "updated_at": datetime.now()
            }}
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alerta no encontrada o ningún cambio realizado"
            )
        
        # Devolver la alerta actualizada
        updated_alert = await alerts_collection.find_one({"_id": ObjectId(alert_id)})
        updated_alert["id"] = str(updated_alert["_id"])
        del updated_alert["_id"]
        
        return updated_alert
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar alerta: {str(e)}"
        )
