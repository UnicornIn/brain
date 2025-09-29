from pydantic import BaseModel
from typing import List

# Modelos Pydantic
class MessengerData(BaseModel):
    user_id: str
    text: str


class MessengerSendMessage(BaseModel):
    data: MessengerData
    allowed_roles: List[str] = []
