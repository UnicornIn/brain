from fastapi import HTTPException
from bson import json_util
import json
from app.database.mongo import contacts_collection
from typing import List

async def get_all_contacts() -> List[dict]:
    """
    Obtiene TODOS los contactos de la colección con TODOS sus campos
    """
    try:
        # Obtener todos los documentos sin filtros (usando to_list() para Motor)
        contacts = await contacts_collection.find({}).to_list(length=None)
        
        # Convertir ObjectId y otros campos BSON a JSON serializable
        contacts_json = json.loads(json_util.dumps(contacts))
        
        return contacts_json
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener contactos: {str(e)}"
        )