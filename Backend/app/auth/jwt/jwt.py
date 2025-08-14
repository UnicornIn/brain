from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from datetime import datetime, timedelta
from passlib.context import CryptContext
from typing import Optional
import os

from app.database.mongo import user_collection

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Configuraciones
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ✅ La función base
def get_current_user(allowed_roles: list[str] = None):
    async def _get_user(token: str = Depends(oauth2_scheme)):
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            role = payload.get("role")

            if not user_id or (allowed_roles and role not in allowed_roles):
                raise credentials_exception

        except JWTError:
            raise credentials_exception

        user = await user_collection.find_one({"id": user_id})
        if not user:
            raise credentials_exception

        return user
    return _get_user

# ✅ Wrapper para roles personalizados
def get_current_user_with_roles(allowed_roles: list[str]):
    async def dependency(token: str = Depends(oauth2_scheme)):
        return await get_current_user(token, allowed_roles)
    return dependency

async def authenticate_user(email: str, password: str, user_collection, allowed_roles: Optional[list[str]] = None):
    user = await user_collection.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        return None
    
    # Si se especifican roles válidos, verificar el rol
    if allowed_roles and user.get("role") not in allowed_roles:
        return None

    return user
