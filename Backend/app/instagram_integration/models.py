from pydantic import BaseModel

class InstagramSendMessage(BaseModel):
    user_id: str
    text: str