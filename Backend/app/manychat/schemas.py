from pydantic import BaseModel
from typing import Optional

class ManychatWebhookPayload(BaseModel):
    subscriber_id: Optional[str]
    event: Optional[str]
    data: Optional[dict]
