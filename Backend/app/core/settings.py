from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Importa el middleware CORS
from dotenv import load_dotenv

from app.auth.routes import router as auth_router
from app.manychat.routes import router as manychat_router
from app.client.routes import router as subscribers_router
from app.agents.routes import router as agents_router


load_dotenv()

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Permite todos los orígenes (en producción, especifica los dominios correctos)
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos
    allow_headers=["*"],  # Permite todos los headers
)


# Incluye todos los routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(manychat_router, prefix="/manychat", tags=["Manychat"])
app.include_router(subscribers_router, prefix="/subscribers", tags=["Subscribers"])
app.include_router(agents_router, prefix="/agents", tags=["Agents"])
