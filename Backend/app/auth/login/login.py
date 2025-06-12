# app/routes/auth.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.auth.jwt.jwt import create_access_token, authenticate_user
from app.database.mongo import user_collection

router = APIRouter()

@router.post("/login", summary="Login user and return access token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Usa form_data.username como email
    user = await authenticate_user(form_data.username, form_data.password, user_collection)
    if not user:
        raise HTTPException(status_code=401, detail="Correo o contraseña inválidos")

    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "country": user["country"]
        }
    }
