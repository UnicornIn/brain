import os
from dotenv import load_dotenv
from pymongo import MongoClient
import chromadb
from chromadb.config import Settings

load_dotenv()

# --- Conexión a Mongo ---
MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise ValueError("⚠️ Falta la variable MONGODB_URI en el archivo .env")

mongo_client = MongoClient(MONGODB_URI)

# --- Conexión a Chroma ---

CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_HOST = os.getenv("CHROMA_HOST", "https://api.trychroma.com")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_SSL = os.getenv("CHROMA_SSL", "true").lower() == "true"
chroma_collection_name = os.getenv("CHROMA_COLLECTION")  # opcional

if not CHROMA_API_KEY or not CHROMA_TENANT:
    raise ValueError("⚠️ Faltan variables CHROMA_API_KEY o CHROMA_TENANT en el archivo .env")

# Cliente principal
chroma_client = chromadb.HttpClient(
    ssl=CHROMA_SSL,
    host=CHROMA_HOST,
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE,
    headers={"x-chroma-token": CHROMA_API_KEY}
)

# 🔍 Obtener todas las colecciones disponibles
collections = chroma_client.list_collections()
print("📂 Colecciones encontradas en la BD:")
for col in collections:
    print(f" - {col.name}")

# ✅ Construir un diccionario con todas las colecciones
chroma_collections = {
    col.name: chroma_client.get_collection(name=col.name)
    for col in collections
}

# (opcional) Si quieres mantener compatibilidad con código viejo que espera `chroma_collection`
# puedes apuntar a la primera colección encontrada
chroma_collection = next(iter(chroma_collections.values()), None)