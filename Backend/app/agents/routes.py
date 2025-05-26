
from fastapi import APIRouter
from app.agents.alerts.alerts import router as alerts_router
from app.agents.upload.upload_doc import router as upload_router
from app.agents.asistent.assistant_message import router as assistant_router

router = APIRouter()

router.include_router(assistant_router)
router.include_router(upload_router)
router.include_router(alerts_router)
       
    