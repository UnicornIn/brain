import json
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

# Asegúrate de tener configurado OPENAI_API_KEY en .env y cargado donde inicialices openai
openai = OpenAI()
OpenAI.api_key = os.getenv("OPENAI_API_KEY")

def build_dynamic_prompt(schema_json: dict, user_prompt: str) -> str:
    prompt = "Bases de datos y colecciones disponibles:\n\n"
    for db_name, collections in schema_json.items():
        prompt += f"{db_name} contiene:\n"
        for col_name, fields in collections.items():
            prompt += f" - {col_name}: campos como {', '.join(fields.keys())}\n"
            for field, examples in fields.items():
                if examples:
                    prompt += f"    Ejemplo de '{field}': {examples[0]}\n"
                    break
        prompt += "\n"
    
    prompt += """
    Eres un generador de queries para un agente RAG que trabaja con:
    - MongoDB Atlas con bases: DataUser y DatabaseInvetary.
    - Chroma en la nube para documentos embebidos.
Reglas para interpretar preguntas:
- Si se habla de cantidades, stock, pedidos, fechas, prioriza MongoDB.
- si vas a hacer busquedas por fechas ten encuenta el año en el que estamos que es 2025
- si se habla de citas, servicios, nombres de clientes prioriza Chroma.
- Si es documental o general, usa Chroma.
- Si no se sabe, busca en ambos.
- Usa nombres exactos de campos y colecciones.
- utiliza el json como guia ahi hay ejemplos de como es la base de datos DataUser y DatabaseInvetary.
- si se habla de citas utiliza chroma.
- utiliza inteligentemente el "schema_examples.json" te va ayudar a decidir en coleccion y base de datos buscar.

- Devuelve solo JSON con esta estructura (sin explicaciones):

{
  "source": "mongo" | "chroma" | "both",
  "mongo": [
    {
      "database": "DataUser" | "DatabaseInvetary",
      "collection": "<collection_name_or_null>",
      "filter": { ... },
      "sort": { "campo": 1 | -1 },    // opcional, orden asc(1) o desc(-1)
      "limit": número entero          // opcional, máximo documentos a devolver
    }
  ],
  "chroma": {
    "text": "texto para búsqueda semántica",
    "limit": 5
  }
}

Reglas:
- Usa 'sort' y 'limit' para consultas que pidan "menos", "más" o "top".
- Si la pregunta pide datos estructurados, prioriza mongo.
- Si necesita contexto textual, prioriza chroma.
- Devuelve JSON estrictamente válido, sin comentarios ni explicaciones.

Ejemplo válido:

{
  "source": "mongo",
  "mongo": [
    {
      "database": "DatabaseInvetary",
      "collection": "productos",
      "filter": {"stock": {"$exists": true}},
      "sort": {"stock": 1},
      "limit": 1
    }
  ],
  "chroma": null
}

  ],
  "chroma": {
    "text": "texto para busqueda semantica",
    "limit": 5
  }
}

Considera que las fechas en las bases de datos pueden estar en distintos formatos, incluyendo:

- "DD/MM/YYYY" (ejemplo: "16/07/2025")
- "YYYY-MM-DD" (ejemplo: "2025-07-16")
- "YYYY-MM-DDTHH:mm:ssZ" (ISO 8601 completo)
- Timestamps numéricos o strings con hora opcional

Al generar filtros que incluyan fechas, siempre devuelve las fechas en formato string ISO 8601 estándar: "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ssZ".

No uses formatos específicos de Mongo como ISODate(...) ni funciones no válidas en JSON.

Ejemplo correcto de filtro con fechas:

{
  "fecha": {
    "$gte": "2025-06-01T00:00:00Z",
    "$lt": "2025-07-01T00:00:00Z"
  }
}

Pregunta del usuario: """ + user_prompt + "\nResponde solo con JSON válido."
    
    return prompt


def query_generator(user_prompt: str) -> dict:
    # Carga el esquema externo
    with open("app/ai_agent/schema_examples.json", "r", encoding="utf-8") as f:
        schema_json = json.load(f)
    
    prompt = build_dynamic_prompt(schema_json, user_prompt)
    
    resp = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": prompt}],
        temperature=0
    )
    
    text = resp.choices[0].message.content
    try:
        data = json.loads(text)
        data.setdefault("source", "mongo")
        data.setdefault("mongo", [])
        if data.get("chroma") is None:
            data["chroma"] = None
        return data
    except Exception as e:
        print("Error parseando JSON:", e)
        print("Salida LLM:", text)
        return {"source": "mongo", "mongo": [], "chroma": None}







