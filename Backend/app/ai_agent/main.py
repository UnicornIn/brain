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


def build_llm_payload(retrieved: dict, max_groups: int = 50, sample_docs: int = 3) -> dict:
    payload = {"chosen_source": retrieved.get("chosen_source"), "summary": retrieved.get("summary")}
    llm = {}

    # Mongo aggregate
    mongo = retrieved.get("mongo", {})
    agg = {}
    for k, v in mongo.items():
        if isinstance(v, dict) and v.get("operation") == "aggregate":
            rows = (v.get("results") or [])[:max_groups]  # top-N grupos
            agg[k] = {
                "rows": rows,
                "showing": v.get("showing"),
                "total_found": v.get("total_found"),
                "page": v.get("page")
            }
    if agg: llm["mongo_aggregate"] = agg

    # Mongo find
    finds = {}
    for k, v in mongo.items():
        if isinstance(v, dict) and v.get("operation") == "find":
            docs = (v.get("documents") or [])[:sample_docs]
            finds[k] = {"count": v.get("count"), "sample": docs, "page": v.get("page")}
    if finds: llm["mongo_find"] = finds

    # Chroma
    chroma = retrieved.get("chroma") or {}
    chroma_out = {}
    for cname, data in chroma.items():
        if isinstance(data, dict) and data.get("documents"):
            short = []
            for d in data["documents"][:10]:
                short.append({
                    "metadata": d.get("metadata", {}),
                    "similarity": round(d.get("similarity", 0), 4),
                    "collection": d.get("collection"),
                    "preview": (d.get("content") or "")[:200]
                })
            chroma_out[cname] = {"count": data.get("count"), "docs": short}
    if chroma_out: llm["chroma"] = chroma_out

    payload["llm_payload"] = llm
    return payload


@router.post("/ask")
def ask(
    payload: QueryIn,
    x_user_id: str | None = Header(default="default_user"),
    mode: str = Query("production", description="Modo de respuesta: 'debug' o 'production'")
):
    user_id = x_user_id
    history = conversation_memory.get(user_id, deque(maxlen=MAX_CONTEXT))
    user_q = payload.question

    # 1. Generar queries y ejecutar
    queries = query_generator(user_q)
    retrieved = execute_queries(queries)

    # 2. Construir payload resumido
    llm_payload = build_llm_payload(retrieved, max_groups=50, sample_docs=3)

    # 3. Preparar prompt para LLM
    system = "Eres un asistente que responde claro y profesional, estilo corporativo."
    conversation_context = "".join(
        f"Usuario: {q}\nAsistente: {a}\n" for q, a in history
    )

    user_content = (
        f"Contexto:\n{conversation_context}\n"
        f"Pregunta: {user_q}\n\n"
        "Datos (agregados y resumidos, no inventes nada, reporta exactamente lo que ves):\n"
        f"{json.dumps(llm_payload, ensure_ascii=False)}\n\n"
        "Si hay 'mongo_aggregate', entrega KPIs (tendencia, top-N, totales) en viñetas. "
        "Si hay 'mongo_find', usa solo el 'count' y 'sample' como ejemplos. "
        "Si hay 'chroma', menciona solo títulos/fechas si existen en metadata. "
        "No expandas texto largo ni pegues JSON completo en la respuesta."
    )

    # 4. Llamar al LLM
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

        # 5. Limpiar saltos de línea innecesarios
        answer_clean = " ".join(
            line.strip() for line in answer.splitlines() if line.strip()
        )

        # 6. Guardar en historial
        history.append((user_q, answer_clean))
        conversation_memory[user_id] = history

        if mode == "debug":
            return {
                "mode": "debug",
                "queries": queries,
                "retrieved": retrieved,
                "llm_payload": llm_payload,
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
