from pydantic import BaseModel
from typing import List

class InstagramData(BaseModel):
    user_id: str
    text: str

class InstagramSendMessage(BaseModel):
    data: InstagramData
    allowed_roles: List[str]
    
    