from pydantic import BaseModel


class WhatsAppMessageSchema(BaseModel):
    wa_id: str
    text: str
    
    