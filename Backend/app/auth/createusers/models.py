from pydantic import BaseModel, EmailStr
from typing import Literal

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    country: str
    password: str
    role: Literal["admin", "member", "moderator"] = "member"

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    country: str
    role: str
    created_at: str
