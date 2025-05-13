import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from app.database.mongo import messages_collection
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
from uuid import uuid4
import traceback
# from app.agents.models import QuestionRequest

load_dotenv()
router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
VECTOR_STORE_ID = os.getenv("OPENAI_VECTOR_STORE_ID")
KNOWLEDGE_AGENT_ID = os.getenv("OPENAI_KNOWLEDGE_AGENT_ID")

@router.post("/upload-doc")
async def upload_doc(file: UploadFile = File(...)):
    allowed_extensions = (".pdf", ".txt", ".md", ".docx")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(400, "Formato de archivo no compatible")

    try:
        # Subir directamente al vector store usando el método actualizado
        file_content = await file.read()
        with open(file.filename, "wb") as f:
            f.write(file_content)
        
        with open(file.filename, "rb") as file_stream:
            file_batch = client.vector_stores.file_batches.upload_and_poll(
                vector_store_id=VECTOR_STORE_ID,
                files=[file_stream],
                poll_interval_ms=3000  # Intervalo de verificación
            )

        if file_batch.status == "completed":
            return {
                "message": "Archivo procesado exitosamente",
                "detalles": {
                    "archivos_subidos": file_batch.file_counts.completed,
                    "lote_id": file_batch.id
                }
            }
        else:
            raise HTTPException(500, f"Error en procesamiento: {file_batch.status}")

    except Exception as e:
        raise HTTPException(500, f"Error interno: {str(e)}") from e
    finally:
        if os.path.exists(file.filename):
            os.remove(file.filename)
            
@router.post("/manychat-agent")
async def manychat_agent(request: Request):
    """Endpoint especial para ManyChat"""
    try:
        data = await request.json()
        print(f"Data recibida: {data}")
        question = data.get("user_input")  # El campo que ManyChat mandará
        print(f"Pregunta recibida: {question}")

        if not question:
            raise HTTPException(400, "No se recibió 'user_input' válido")

        # Crear thread si no existe
        thread = client.beta.threads.create()
        thread_id = thread.id
        print(f"Thread creado con ID: {thread_id}")

        # Crear mensaje de usuario
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=question
        )
        print(f"Mensaje de usuario creado en el thread {thread_id}")

        # Ejecutar el agente
        print("Assistant ID:", KNOWLEDGE_AGENT_ID)
        run = client.beta.threads.runs.create_and_poll(
            thread_id=thread_id,
            assistant_id=KNOWLEDGE_AGENT_ID
        )
        print(f"Estado del agente: {run.status}")

        if run.status == "completed":
            messages = client.beta.threads.messages.list(thread_id=thread_id)
            print(f"Mensajes obtenidos del thread {thread_id}: {messages}")
            assistant_messages = [
                msg.content[0].text.value
                for msg in messages.data
                if msg.role == "assistant"
            ]
            print(f"Mensajes del asistente: {assistant_messages}")

            return {
                "messages": [
                    {"text": assistant_messages[0]}
                ]
            }
        else:
            raise HTTPException(500, f"Error del agente: {run.status}")
    
    except Exception as e:
        print(f"Error en manychat-agent: {str(e)}")
        raise HTTPException(500, f"Error: {str(e)}")
