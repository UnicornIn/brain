from pydantic import BaseModel


class MessengerSendMessage(BaseModel):
    user_id: str
    text: str