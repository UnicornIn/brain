from pydantic import BaseModel
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

# Pydantic model for request/response
class CommunityCreate(BaseModel):
    title: str
    description: str
    url: str
    image: Optional[str] = None  # URL o nombre del archivo

class CommunityResponse(BaseModel):
    id: str
    title: str
    description: str
    url: str
    members: int
    created_at: str
    image: Optional[str]  # <- Este campo viene de "image_url" en Mongo

    
class CommunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    

class CommunityResponse(BaseModel):
    id: str
    title: str
    description: str
    url: str
    members: int
    created_at: datetime
    image_url: str