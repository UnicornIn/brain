from fastapi import APIRouter, HTTPException
from app.client.controllers import get_all_contacts
from fastapi.responses import JSONResponse

router = APIRouter(
    prefix="/subscribers/contacts",  # Cambiado para coincidir con tu URL
)

@router.get("/all")
async def get_all_contacts_endpoint():
    """
    Obtiene TODOS los contactos de la colección con TODOS sus campos
    
    Devuelve:
    - Array completo con todos los documentos de la colección
    - Cada documento con todos sus campos originales
    - Incluyendo _id, custom_fields y todos los metadatos
    
    Ejemplo de respuesta exitosa:
    {
        "status": "success",
        "count": 2,
        "data": [
            {
                "_id": "680675f555b45d586709069a",
                "subscriber_id": "550714087",
                ...
            },
            ...
        ]
    }
    """
    try:
        contacts = await get_all_contacts()
        
        return JSONResponse({
            "status": "success",
            "count": len(contacts),
            "data": contacts
        })
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error inesperado: {str(e)}"
        )