import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
VECTOR_STORE_ID = os.getenv("OPENAI_VECTOR_STORE_ID")

@router.post("/upload-doc")
async def upload_doc(file: UploadFile = File(...)):
    if not file.filename.endswith((".pdf", ".txt", ".md", ".docx")):
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")

    # Lee archivo y se guarda en openai vector store
    contents = await file.read()
    openai_file = client.files.create(
        file=(file.filename, contents),
        purpose="assistants"
    )

    # Asociar el archivo con el vector store
    client.beta.vector_stores.files.create(
        vector_store_id=VECTOR_STORE_ID,
        file_id=openai_file.id
    )

    return {
        "message": "Archivo cargado exitosamente",
        "file_id": openai_file.id
    }
