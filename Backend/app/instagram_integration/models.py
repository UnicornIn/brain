from pydantic import BaseModel

class InstagramMessageData(BaseModel):
    user_id: str        # siempre debe ser el sender_id numérico de Instagram
    text: str
    username: str | None = None  # opcional, solo para mostrar en UI

class InstagramSendMessage(BaseModel):
    data: InstagramMessageData

    
    