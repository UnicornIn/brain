from fastapi import APIRouter
from app.auth.createusers.createusers import router as create_user_router


router = APIRouter()

router.include_router(create_user_router)
