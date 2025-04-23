from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

# Cargar .env por si se usa este archivo directamente
load_dotenv()

client = None
db = None

def connect_to_mongo():
    global client, db
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_NAME", "DatabaseInventory")

    if not uri:
        raise Exception("La variable MONGODB_URI no está definida en el .env")

    client = AsyncIOMotorClient(uri)
    db = client[db_name]
