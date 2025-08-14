from app.instagram_integration.controllers import send_instagram_message
from app.instagram_integration.models import InstagramSendMessage
from app.database.mongo import messages_collection
from app.auth.jwt.jwt import get_current_user
from fastapi import APIRouter
from fastapi import Depends, HTTPException
from datetime import datetime

router = APIRouter()


@router.post("/send")
async def send_message_instagram(
    payload: InstagramSendMessage,
    user: dict = Depends(get_current_user(["admin"]))
):
    """
    Sends a message to an Instagram user using the Messenger API.
    """
    try:
        response = await send_instagram_message(payload.data.user_id, payload.data.text)

        if response.status_code == 200:
            # Guardar en la conversación adecuada
            await messages_collection.update_one(
                {"user_id": payload.data.user_id, "platform": "instagram"},
                {
                    "$push": {
                        "messages": {
                            "sender": "system",
                            "name": user["name"],
                            "content": payload.data.text,
                            "timestamp": datetime.utcnow()
                        }
                    },
                    "$set": {
                        "last_message": payload.data.text
                    }
                },
                upsert=True
            )

            return {
                "status": "sent",
                "to": payload.data.user_id,
                "message": payload.data.text,
                "instagram_response": response.json()
            }
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error enviando mensaje a Instagram: {response.text}"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
