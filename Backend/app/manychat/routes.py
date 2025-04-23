from fastapi import APIRouter
from .controllers import get_subscribers_by_custom_field, get_subscriber_info

router = APIRouter()

@router.get("/subscriber/{subscriber_id}",
            summary="Obtiene información de un suscriptor",
            description="Devuelve los detalles de un suscriptor específico de ManyChat")
async def get_subscriber(subscriber_id: str):
    return await get_subscriber_info(subscriber_id)

@router.get("/subscribers/by_custom_field",
            summary="Filtra suscriptores por campo personalizado",
            description="Filtra suscriptores por campo personalizado (ej. country=Mexico)")
async def get_subscribers_by_field(field: str, value: str):
    return await get_subscribers_by_custom_field(field, value)
