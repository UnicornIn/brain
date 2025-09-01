from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime
from app.database.mongo import company_collection, user_collection
from app.companies.models import CompanyCreate

router = APIRouter()

@router.post("/", response_model=dict)
async def create_company(company: CompanyCreate):
    data = company.dict()
    data["created_at"] = datetime.utcnow()

    result = await company_collection.insert_one(data)
    return {
        "id": str(result.inserted_id),
        "message": "Empresa creada con éxito"
    }

@router.put("/users/add-company-info")
async def add_company_to_users():
    try:
        # ID de la empresa
        company_id = ObjectId("68acb6814b37a28a3865f4e3")
        company_name = "Rizos Felices"

        # Actualizar TODOS los usuarios
        result = await user_collection.update_many(
            {},
            {
                "$set": {
                    "company_id": company_id,
                    "company_name": company_name
                }
            }
        )

        return {
            "status": "success",
            "matched": result.matched_count,
            "modified": result.modified_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))