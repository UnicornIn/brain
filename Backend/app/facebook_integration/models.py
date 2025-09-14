from pydantic import BaseModel
from typing import List

class MessengerData(BaseModel):
    user_id: str
    text: str

class MessengerSendMessage(BaseModel):
    data: MessengerData
    allowed_roles: List[str]
