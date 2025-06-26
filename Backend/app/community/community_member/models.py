from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from enum import Enum
from typing import List, Optional

class MemberRole(str, Enum):
    MEMBER = "member"

class Member(BaseModel):
    id: str = Field(..., alias="_id", description="ID del documento en MongoDB")
    community_id: str = Field(..., description="ID UUID de la comunidad")
    user_id: str = Field(..., description="ID único generado automáticamente")
    full_name: str = Field(..., description="Nombre completo")
    email: str = Field(..., description="Email")
    phone: str = Field(..., description="Teléfono")
    join_reason: Optional[str] = Field(None, description="Razón para unirse")
    city: Optional[str] = Field(None, description="Ciudad del miembro")
    country: Optional[str] = Field(None, description="País del miembro")
    has_completed_survey: bool = Field(default=True)
    registration_date: str = Field(..., description="Fecha de registro")
    role: str = Field(..., description="Rol del miembro")
    status: str = Field(..., description="Estado del miembro")

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            ObjectId: str
        }

class MemberCreate(BaseModel):
    community_id: str = Field(..., description="ID UUID de la comunidad")
    full_name: str = Field(..., description="Nombre completo")
    email: str = Field(..., description="Email")
    phone: str = Field(..., description="Teléfono")
    join_reason: Optional[str] = Field(None, description="Razón para unirse")
    city: str = Field(..., description="Ciudad del miembro")
    country: str = Field(..., description="País del miembro")
    
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
        
