from pydantic import BaseModel, Field, validator
from datetime import datetime
from bson import ObjectId
from enum import Enum
from typing import List, Optional

class MemberRole(str, Enum):
    MEMBER = "member"

class Member(BaseModel):
    community_id: str = Field(..., description="ID UUID de la comunidad")
    user_id: str = Field(default_factory=lambda: str(ObjectId()))
    full_name: str = Field(..., description="Nombre completo")
    email: str = Field(..., description="Email")
    phone: str = Field(..., description="Teléfono")
    join_reason: Optional[str] = Field(None, description="Razón para unirse")
    city: Optional[str] = Field(None, description="Ciudad del miembro")
    country: Optional[str] = Field(None, description="País del miembro")
    has_completed_survey: bool = Field(default=True)
    registration_date: str = Field(default_factory=lambda: datetime.now().strftime("%d/%m/%Y"))
    role: str = Field(default="member", description="Rol del miembro")
    status: str = Field(default="active", description="Estado del miembro")

    class Config:
        arbitrary_types_allowed = True
        allow_population_by_field_name = True
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
    city: Optional[str] = Field(None, description="Ciudad del miembro")
    country: Optional[str] = Field(None, description="País del miembro")

class MemberResponse(Member):
    id: str = Field(..., alias="_id")  # Requerido en respuesta

    @validator('id', pre=True)
    def validate_id(cls, v):
        if v is None:
            raise ValueError("_id no puede ser None")
        return str(v)

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