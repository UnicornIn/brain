from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# Inicializa la conexión inmediatamente
uri = os.getenv("MONGODB_URI")
db_name = os.getenv("MONGODB_NAME", "DataUser")

if not uri:
    raise RuntimeError("MONGODB_URI no está definida en .env")

client = AsyncIOMotorClient(uri)
db = client[db_name]
contacts_collection = db["contacts"]

# Esta función ya no es necesaria, pero la mantenemos por compatibilidad
def connect_to_mongo():
    pass