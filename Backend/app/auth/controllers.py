from fastapi import HTTPException
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from app.auth.schemas import LoginRequest
from app.database.mongo import db  # Conexión a MongoDB
import os

# Contexto para verificar contraseñas encriptadas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Variables de entorno
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))  # Con valor por defecto

# Función principal para login
async def login_user(data: LoginRequest):
    # Buscar usuario por email
    user = await db["users"].find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Verificar contraseña
    if not pwd_context.verify(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    # Crear payload del token JWT
    token_data = {
        "sub": str(user["_id"]),
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }

    # Generar token
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token, "token_type": "bearer"}
