from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from enum import Enum
from typing import List, Optional

class MemberRole(str, Enum):
    MEMBER = "member"

class Member(BaseModel):
    community_id: str = Field(..., description="ID UUID de la comunidad")
    user_id: str = Field(default_factory=lambda: str(ObjectId()), description="ID único generado automáticamente")
    full_name: str = Field(..., description="Nombre completo")
    email: str = Field(..., description="Email")
    phone: str = Field(..., description="Teléfono")
    join_reason: str = Field(..., description="Razón para unirse")
    has_completed_survey: bool = Field(default=True)
    registration_date: str = Field(default_factory=lambda: datetime.now().strftime("%d/%m/%Y"))
    role: MemberRole = Field(default=MemberRole.MEMBER)
    status: str = Field(default="active")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }

class MemberCreate(BaseModel):
    community_id: str = Field(..., description="ID UUID de la comunidad")
    full_name: str = Field(..., description="Nombre completo")
    email: str = Field(..., description="Email")
    phone: str = Field(..., description="Teléfono")
    join_reason: Optional[str] = Field(None, description="Razón para unirse")
    
class MemberResponse(Member):
    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }

class MemberListResponse(BaseModel):
    members: List[MemberResponse]
    count: int
    
class MemberUpdate(BaseModel):
    full_name: Optional[str] = Field(None, description="Nombre completo")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Teléfono")
    join_reason: Optional[str] = Field(None, description="Razón para unirse")
    status: Optional[str] = Field(None, description="Estado (active/inactive)")
    
    class Config:
        schema_extra = {
            "example": {
                "full_name": "Nuevo Nombre",
                "email": "nuevo@email.com",
                "status": "inactive"
            }
        }
        
