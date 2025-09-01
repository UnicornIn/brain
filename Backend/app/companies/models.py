# app/models/company.py
from pydantic import BaseModel
# from typing import Optional
from pydantic import EmailStr

class CompanyCreate(BaseModel):
    name: str
    country: str
    city: str
    address: str
    phone: str
    email: EmailStr
