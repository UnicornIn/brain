from datetime import datetime
from fastapi import HTTPException, Request, BackgroundTasks
import os
from fastapi import APIRouter, HTTPException, Request
from openai import OpenAI
from dotenv import load_dotenv
from app.database.mongo import messages_collection
from bson import ObjectId

router = APIRouter()

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
VECTOR_STORE_ID = os.getenv("OPENAI_VECTOR_STORE_ID")
KNOWLEDGE_AGENT_ID = os.getenv("OPENAI_KNOWLEDGE_AGENT_ID")

@router.post("/manychat-agent")
async def manychat_agent(request: Request, background_tasks: BackgroundTasks):
    """Endpoint optimizado que conserva la estructura base pero añade las mejoras solicitadas"""
    try:
        # 1. Procesamiento inicial
        data = await request.json()
        print(f"Data recibida: {data}")
        question = data.get("user_input", "").strip()
        print(f"Pregunta recibida: {question}")

        if not question:
            raise HTTPException(400, "No se recibió 'user_input' válido")

        # 2. Creación de thread
        thread = client.beta.threads.create()
        thread_id = thread.id
        print(f"Thread creado con ID: {thread_id}")

        # 3. Procesamiento en background para las mejoras
        background_tasks.add_task(
            process_and_store_conversation,
            data=data,
            question=question,
            thread_id=thread_id
        )

        # 4. Respuesta rápida al usuario
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=question
        )

        run = client.beta.threads.runs.create_and_poll(
            thread_id=thread_id,
            assistant_id=KNOWLEDGE_AGENT_ID
        )
        print(f"Estado del agente: {run.status}")

        if run.status == "completed":
            messages = client.beta.threads.messages.list(thread_id=thread_id)
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

async def process_and_store_conversation(data: dict, question: str, thread_id: str):
    """Función que procesa y almacena los datos como solicitaste"""
    try:
        # 1. Determinar canal e identificadores relevantes
        channel, identifiers = get_channel_and_identifiers(data)
        
        # 2. Obtener respuesta del asistente (si es necesario)
        messages = client.beta.threads.messages.list(thread_id=thread_id)
        assistant_messages = [
            msg.content[0].text.value
            for msg in messages.data
            if msg.role == "assistant"
        ]
        assistant_response = assistant_messages[0] if assistant_messages else ""

        # 3. Crear documento optimizado para MongoDB
        conversation_data = {
            "_id": ObjectId(),
            "conversation_id": f"conv_{datetime.now().timestamp()}_{data.get('subscriber_id','')}",
            "subscriber_id": data.get("subscriber_id"),
            "channel": channel,
            "user_input": question,
            "assistant_response": assistant_response,
            "last_interaction": datetime.now(),
            "user_identifiers": identifiers,
            "metadata": {
                "thread_id": thread_id,
                "source": "manychat"
            }
        }

        # 4. Guardar en MongoDB
        result = await messages_collection.insert_one(conversation_data)
        print(f"Conversación guardada para subscriber {data.get('subscriber_id')}")
        print(f"Guardado correctamente en la colección: {messages_collection.name}")
        print(f"ID del documento insertado: {result.inserted_id}")

    except Exception as e:
        print(f"Error al guardar conversación: {str(e)}")

def is_valid_field(value: str) -> bool:
    """Valida que el campo no sea nulo, vacío ni una plantilla sin procesar."""
    return bool(value) and not str(value).strip().startswith("{{")

def get_channel_and_identifiers(data: dict) -> tuple[str, dict]:
    """Determina el canal y devuelve solo los identificadores relevantes, con validación real."""
    print("🔍 Buscando canal e identificadores en los datos recibidos...")

    whatsapp = data.get("whatsapp_phone")
    tt_username = data.get("tt_username")
    ig_username = data.get("ig_username")
    gender = data.get("gender")

    print(f"📱 WhatsApp: {whatsapp}")
    print(f"🎵 TikTok: {tt_username}")
    print(f"📸 Instagram: {ig_username}")
    print(f"👤 Género (Facebook): {gender}")

    if is_valid_field(tt_username):
        print("✅ Canal detectado: TikTok")
        return "tiktok", {"tt_username": tt_username}
    if is_valid_field(ig_username):
        print("✅ Canal detectado: Instagram")
        return "instagram", {"ig_username": ig_username}
    if is_valid_field(whatsapp):
        print("✅ Canal detectado: WhatsApp")
        return "whatsapp", {"whatsapp_phone": whatsapp}
    if is_valid_field(gender):
        print("✅ Canal detectado: Facebook")
        return "facebook", {"gender": gender}

    print("⚠️ Canal desconocido")
    return "unknown", {}
