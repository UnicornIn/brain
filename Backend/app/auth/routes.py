from fastapi import APIRouter
from app.auth.controllers import login_user
from app.auth.schemas import LoginRequest, TokenResponse

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    return await login_user(data)
