from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Importa el middleware CORS
from dotenv import load_dotenv
from app.manychat.routes import router as manychat_router
from app.client.routes import router as client_router
from app.agents.routes import router as agents_router
from app.community.module_community.community import router as community_router
from app.auth.login.login import router as login_router
from app.auth.createusers.createusers import router as create_user_router
from app.community.community_member.member import router as member_router
from app.websocket.routes import router as ws_router
# from app.ai_agent.api_agent import router as agentv2_router
from app.whatsapp_integration.routes import router as whatsapp_router
from app.instagram_integration.routes import router as instagram_router
from app.meta_webhook.routes import router as meta_webhook_router
from app.facebook_integration.routes import router as facebook_router
from app.conversations.routes import router as conversations_router 

load_dotenv()

app = FastAPI()

app.include_router(ws_router)
app.include_router(meta_webhook_router)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000",
                   "https://appbrain.rizosfelices.co","https://staging-app.rizosfelices.co"],
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos
    allow_headers=["*"],  # Permite todos los headers
)

    
# Incluye todos los routers
app.include_router(login_router, prefix="/auth", tags=["Auth"])
app.include_router(create_user_router, prefix="/auth", tags=["Create User"])
app.include_router(manychat_router, prefix="/manychat", tags=["Manychat"])
app.include_router(client_router, prefix="/client", tags=["Client"])
app.include_router(agents_router, prefix="/agents", tags=["Agents"])
app.include_router(community_router, prefix="/community", tags=["Community"])
app.include_router(member_router, prefix="/community", tags=["Community Member"])
app.include_router(ws_router, prefix="/ws", tags=["WebSocket"])
# app.include_router(agentv2_router, prefix="/agentv2", tags=["Agent V2"])
app.include_router(whatsapp_router, prefix="/whatsapp", tags=["WhatsApp Integration"])
app.include_router(instagram_router, prefix="/instagram", tags=["Instagram Integration"])
app.include_router(meta_webhook_router, prefix="/meta-webhook", tags=["Meta Webhook"])
app.include_router(facebook_router, prefix="/facebook", tags=["Facebook Integration"])
app.include_router(conversations_router, prefix="/conversations", tags=["Conversations"])