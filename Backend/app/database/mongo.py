from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize the connection immediately
uri = os.getenv("MONGODB_URI")
db_name = os.getenv("MONGODB_NAME", "DataUser")

if not uri:
    raise RuntimeError("MONGODB_URI no está definida en .env")

client = AsyncIOMotorClient(uri)
db = client[db_name]
contacts_collection = db["contacts"]
message_collection = db["message"]
alerts_collection = db["alerts"]
community_collection = db["community"]
user_collection = db["users"]
member_collection = db["members"]
messages_collection = db["messages"]

# This function is no longer needed, but we keep it for compatibility
def connect_to_mongo():
    pass