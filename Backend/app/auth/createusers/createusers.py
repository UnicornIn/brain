from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from app.auth.createusers.models import UserCreate, UserResponse
from app.database.mongo import user_collection
import uuid
from datetime import datetime

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate):
    # Verificar si el correo ya existe
    existing_user = await user_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    user_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()

    user_doc = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "country": user.country,
        "password": hashed_password,
        "role": user.role,
        "created_at": created_at
    }

    result = await user_collection.insert_one(user_doc)

    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to create user")

    return UserResponse(
        id=user_id,
        name=user.name,
        email=user.email,
        country=user.country,
        role=user.role,
        created_at=created_at
    )
