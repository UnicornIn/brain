from pydantic import BaseModel

# whatsapp message model
class Message(BaseModel):
    wa_id: str
    text: str
    user_id: str
    direction: str
    timestamp: str