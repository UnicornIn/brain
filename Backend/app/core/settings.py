from fastapi import FastAPI
from dotenv import load_dotenv
import os

from app.database.mongo import connect_to_mongo
from app.auth.routes import router as auth_router
from app.manychat.routes import router as manychat_router
from app.agents.upload import router as upload_router
# Cargar variables de entorno
load_dotenv()

# Crear instancia de FastAPI
app = FastAPI()

# Conexión a la base de datos
connect_to_mongo()

# Incluir rutas
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(manychat_router, prefix="/manychat", tags=["Manychat"])
app.include_router(upload_router)

