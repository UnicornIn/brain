from datetime import datetime
from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: str
    conversation_id: str
    subscriber_id: str
    channel: str
    user_message: str
    assistant_response: str
    status: str
    timestamp: datetime
    created_at: datetime
    
class AlertUpdate(BaseModel):
    status: str