from fastapi import APIRouter
from app.client.keepclient.routes import router as keepclient_router

router = APIRouter()

router.include_router(keepclient_router)