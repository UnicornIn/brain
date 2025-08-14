import os
from dotenv import load_dotenv
from pymongo import MongoClient
import chromadb
from chromadb.config import Settings

load_dotenv()

# --- Conexión a Mongo ---
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("⚠️ Falta la variable MONGO_URI en el archivo .env")

mongo_client = MongoClient(MONGO_URI)

# --- Conexión a Chroma ---
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_HOST = os.getenv("CHROMA_HOST", "https://api.trychroma.com")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "Test")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_SSL = os.getenv("CHROMA_SSL", "true").lower() == "true"

if not CHROMA_API_KEY or not CHROMA_TENANT:
    raise ValueError("⚠️ Faltan variables CHROMA_API_KEY o CHROMA_TENANT en el archivo .env")

chroma_collection = chromadb.HttpClient(
    ssl=CHROMA_SSL,
    host=CHROMA_HOST,
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE,
    headers={
        "x-chroma-token": CHROMA_API_KEY
    }
)
chroma_collection =chroma_collection.get_collection(name="prueba")