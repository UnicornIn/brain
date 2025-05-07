from pydantic import BaseModel

class QuestionRequest(BaseModel):
    question: str
    thread_id: str | None = None