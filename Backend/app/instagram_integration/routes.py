from app.instagram_integration.controllers import send_instagram_message
from app.instagram_integration.models import InstagramSendMessage
from app.database.mongo import messages_collection
from app.auth.jwt.jwt import get_current_user
from fastapi import APIRouter
from fastapi import Depends

router = APIRouter()



@router.post("/send/instagram")
async def send_message_instagram(data: InstagramSendMessage, user: str = Depends(get_current_user)):
    """
    Sends a message to an Instagram user using the Messenger API.
    """
    response = await send_instagram_message(data.user_id, data.text)

    if response.status_code == 200:
        messages_collection.insert_one(data.dict())
        return {"status": "sent", "result": response.json()}
    else:
        return {"error": "Failed to send message", "details": response.text}
