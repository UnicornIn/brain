from fastapi import Header, HTTPException
from pydantic import BaseModel
from app.ai_agent.query_generator_pydantic import query_generator
from app.ai_agent.rag_search import execute_queries
from dotenv import load_dotenv
from fastapi import UploadFile, File, Form
from app.ai_agent.campaigns_whatsapp import create_and_send_campaign
import shutil
from openai import OpenAI
from fastapi import APIRouter
import datetime
from fastapi import Query
import re
import os
import json
from collections import deque
import asyncio

load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
openai = OpenAI(api_key=OPENAI_KEY)

router = APIRouter(
    prefix="/agent",   # opcional, ruta base
    tags=["RAG agent"] # opcional, etiqueta para la doc
)

class QueryIn(BaseModel):
    question: str

# Memoria contextual simple: {user_id: deque([...])}
conversation_memory = {}

MAX_CONTEXT = 5  # últimas 5 interacciones

# Carpeta temporal para guardar imágenes subidas
UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class CampaignResponse(BaseModel):
    success: bool
    campaign_text: str

@router.post("/send_campaign", response_model=CampaignResponse)
async def send_campaign(
    prompt: str = Form(...),
    image: UploadFile | None = File(None)
):
    image_path = None
    if image:
        # Guarda el archivo subido
        image_path = os.path.join(UPLOAD_DIR, image.filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    
    result = await create_and_send_campaign(prompt, image_path)
    
    # Opcional: eliminar la imagen después de enviar para no acumular archivos
    if image_path and os.path.exists(image_path):
        os.remove(image_path)
    
    return result

# 🔹 Función para limpiar respuesta manteniendo listas si corresponde
def clean_answer(answer: str) -> str:
    lines = [line.strip() for line in answer.splitlines() if line.strip()]
    list_pattern = re.compile(r"^(\d+\.\s+|[-*]\s+)")
    list_like_count = sum(bool(list_pattern.match(line)) for line in lines)

# Función para serializar datos no estándar como datetime
def default_serializer(obj):
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    return str(obj)

@router.post("/ask")
def ask(
    payload: QueryIn,
    x_user_id: str | None = Header(default="default_user"),
    mode: str = Query("production", description="Modo de respuesta: 'debug' o 'production'")
):
    user_id = x_user_id
    history = conversation_memory.get(user_id, deque(maxlen=MAX_CONTEXT))
    user_q = payload.question

    queries = query_generator(user_q)
    retrieved = execute_queries(queries)

    system = "Eres un asistente que responde claro y profesional, manteniendo un estilo corporativo."
    conversation_context = "".join(
        f"Usuario: {q}\nAsistente: {a}\n" for q, a in history
    )

    user_content = (
        f"Contexto de conversación:\n{conversation_context}\n"
        f"Pregunta actual: {user_q}\n\n"
        f"Datos recuperados:\n{json.dumps(retrieved, ensure_ascii=False, indent=2, default=default_serializer)}\n\n"
        "Responde de forma clara y profesional, eliminando saltos de línea innecesarios, "
        "pero conservando viñetas o listas si la información lo requiere. "
        "Si no hay datos, indícalo claramente."
        "cuando se pregunte sobre cantidades haz un conteo y me devuelves en valor numerico si preguntan algo como cuantas, cuantos, cantidad"
    )

    try:
        resp = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2,
            max_tokens=450
        )
        answer = resp.choices[0].message.content.strip()

        # Limpiar saltos de línea innecesarios
        answer_clean = " ".join(
            line.strip() for line in answer.splitlines() if line.strip()
        )

        history.append((user_q, answer_clean))
        conversation_memory[user_id] = history

        if mode == "debug":
            return {
                "mode": "debug",
                "queries": queries,
                "retrieved": retrieved,
                "answer_raw": answer,
                "answer_clean": answer_clean
            }
        else:
            return {
                "mode": "production",
                "answer": answer_clean
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando respuesta GPT: {e}")