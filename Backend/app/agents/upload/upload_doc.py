# Importaciones necesarias
from fastapi import APIRouter, UploadFile, File, HTTPException
from openai import OpenAI
from dotenv import load_dotenv
import os


# Inicialización de variables y cliente
load_dotenv()
router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
VECTOR_STORE_ID = os.getenv("OPENAI_VECTOR_STORE_ID")

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