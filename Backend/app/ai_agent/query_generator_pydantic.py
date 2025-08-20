#query_generator_pydantic.py

import os
import json
import re
import unicodedata
from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ValidationError, field_validator
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# ---------- Pydantic Schemas ----------

class ChromaQuery(BaseModel):
    text: str
    limit: int = Field(default=5, ge=1, le=50)


class MongoQuery(BaseModel):
    database: str
    collection: str
    filter: Dict[str, Any] = Field(default_factory=dict)
    sort: Optional[Dict[str, int]] = None  # {"updated_at": -1}
    limit: int = Field(default=75, ge=1, le=500)


class QueriesBundle(BaseModel):
    source: Literal["mongo", "chroma", "both"]
    mongo: List[MongoQuery] = Field(default_factory=list)
    chroma: Optional[ChromaQuery] = None


# ---------- Helpers: schema + whitelists ----------

HERE = os.path.dirname(__file__)
SCHEMA_PATH = os.path.join(HERE, "schema.json")


def load_schema_examples() -> Dict[str, Any]:
    try:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def allowed_fields_map(schema_json: Dict[str, Any]) -> Dict[tuple, Dict[str, str]]:
    """
    Retorna {(db, collection): {campo: tipo}}.
    Si en schema.json 'fields' es lista de strings → se asume tipo "string".
    Si es lista de dicts → se extrae el tipo definido.
    """
    out = {}
    for db_name, collections in schema_json.items():
        if not isinstance(collections, dict):
            continue
        for col_name, spec in collections.items():
            fields = spec.get("fields") or []
            field_map = {}

            if isinstance(fields, list):
                for f in fields:
                    if isinstance(f, str):
                        field_map[f] = "string"   # default si no hay tipo
                    elif isinstance(f, dict):
                        # {"campo": "tipo"}
                        for k, v in f.items():
                            field_map[k] = v
            elif isinstance(fields, dict):
                # si ya viniera como dict completo
                field_map.update(fields)

            out[(db_name, col_name)] = field_map
    return out


SAFE_MONGO_OPS = {
    "$eq", "$ne", "$gt", "$gte", "$lt", "$lte",
    "$in", "$nin", "$regex", "$exists"
}

def normalize_date(value: str) -> str:
    """
    Normaliza fechas a formato dd/mm/yyyy que usa tu base.
    Acepta ISO (2025-06-23), dd-mm-yyyy, etc.
    """
    # Intenta distintos formatos comunes
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(value, fmt)
            return dt.strftime("%d/%m/%Y")
        except ValueError:
            continue
    return value  # fallback si no matchea nada

def normalize_text(text: str) -> str:
    """ Convierte un string a minúsculas y elimina tildes/acentos usando Unicode NFD. """
    nfkd = unicodedata.normalize("NFD", text)
    return "".join([c for c in nfkd if not unicodedata.combining(c)]).lower().strip()


def accent_insensitive_regex(text: str) -> str:
    """
    Genera un regex insensible a mayúsculas y acentos/tildes, sin depender
    de que el input venga acentuado. Incluye variantes comunes de a/e/i/o/u, ñ y ç.
    Ej: "Medellin" -> (?i)m[eéèêëē]d[eéèêëē]ll[iíìîïī]n
    """
    # Map básico de variantes (puedes ampliarlo si necesitas más)
    ACCENT_GROUPS = {
        "a": "aàáâäãåāăą",
        "e": "eèéêëēĕėęě",
        "i": "iìíîïīĭįı",
        "o": "oòóôöõōŏő",
        "u": "uùúûüũūŭůűų",
        "c": "cçćĉċč",
        "n": "nñńņňŉŋ",
        "y": "yýÿŷ",
    }

    parts = []
    for ch in text:
        # Ignora marcas combinantes si llegan
        if unicodedata.category(ch) == "Mn":
            continue

        # Base sin diacríticos para decidir el grupo
        base = unicodedata.normalize("NFD", ch)[0].lower()

        if base in ACCENT_GROUPS:
            # Grupo con todas las variantes en minúscula; (?i) hará el resto
            group = "[" + re.escape(ACCENT_GROUPS[base]) + "]"
            parts.append(group)
        else:
            # Cualquier otro carácter se escapa tal cual
            parts.append(re.escape(ch))

    pattern = "".join(parts)
    return f"(?i){pattern}"


"""def sanitize_filter(filter_obj: Any, allowed_fields: List[str]) -> Any:
    if isinstance(filter_obj, dict):
        clean = {}
        for k, v in filter_obj.items():
            if k.startswith("$"):
                if k in SAFE_MONGO_OPS:
                    clean[k] = sanitize_filter(v, allowed_fields)
            else:
                if k in allowed_fields:
                    if isinstance(v, str):
                        regex_pattern = accent_insensitive_regex(v)
                        clean[k] = {"$regex": regex_pattern, "$options": "i"}  # refuerzo case-insensitive
                    elif isinstance(v, dict) and "$regex" in v and isinstance(v["$regex"], str):
                        # Si ya venía un $regex como string, lo transformamos también
                        regex_pattern = accent_insensitive_regex(v["$regex"])
                        opts = v.get("$options", "")
                        if "i" not in opts:
                            opts += "i"
                        clean[k] = {"$regex": regex_pattern, "$options": opts}
                    else:
                        clean[k] = sanitize_filter(v, allowed_fields)
        return clean
    elif isinstance(filter_obj, list):
        # Mapea strings dentro de listas (p. ej. en $in) a patrones regex si aplica
        out_list = []
        for x in filter_obj:
            if isinstance(x, str):
                out_list.append({"$regex": accent_insensitive_regex(x), "$options": "i"})
            else:
                out_list.append(sanitize_filter(x, allowed_fields))
        return out_list
    else:
        return filter_obj"""

def sanitize_filter(filter_obj: Any, allowed_fields: Dict[str, str]) -> Any:
    if isinstance(filter_obj, dict):
        clean = {}
        for k, v in filter_obj.items():
            if k.startswith("$"):
                if k in SAFE_MONGO_OPS:
                    clean[k] = sanitize_filter(v, allowed_fields)
            else:
                if k in allowed_fields:
                    ftype = allowed_fields[k]

                    if isinstance(v, str):
                        if ftype == "date":
                            clean[k] = {"$eq": normalize_date(v)}
                        elif ftype in ("int", "float"):
                            try:
                                clean[k] = {"$eq": int(v) if ftype == "int" else float(v)}
                            except Exception:
                                clean[k] = {"$eq": v}
                        else:
                            regex_pattern = accent_insensitive_regex(v)
                            clean[k] = {"$regex": regex_pattern, "$options": "i"}

                    elif isinstance(v, dict):
                        # operadores explícitos ($eq, $gte, etc.)
                        sub = {}
                        for op, val in v.items():
                            if ftype == "date" and isinstance(val, str):
                                sub[op] = normalize_date(val)
                            elif ftype in ("int", "float") and isinstance(val, str):
                                try:
                                    sub[op] = int(val) if ftype == "int" else float(val)
                                except:
                                    sub[op] = val
                            else:
                                sub[op] = val
                        clean[k] = sub
                    else:
                        clean[k] = v
        return clean

    elif isinstance(filter_obj, list):
        return [sanitize_filter(x, allowed_fields) for x in filter_obj]

    else:
        return filter_obj



def sanitize_sort(sort_obj: Optional[Dict[str, int]], allowed_fields: List[str]) -> Optional[Dict[str, int]]:
    if not sort_obj:
        return None
    clean = {}
    for k, v in sort_obj.items():
        if k in allowed_fields and v in (-1, 1):
            clean[k] = v
    return clean or None


# ---------- LLM Prompting ----------

SYSTEM_PROMPT = (
    "Eres un generador de consultas ESTRICTAMENTE ESTRUCTURADO para un CRM.\n"
    "Devuelve SOLO un objeto JSON con este esquema:\n"
    "{\n"
    ' "source": "mongo" | "chroma" | "both",\n'
    ' "mongo": [ { "database": str, "collection": str, "filter": obj, "sort": {campo:1|-1}?, "limit": int? } ],\n'
    ' "chroma": { "text": str, "limit": int? }?\n'
    "}\n"
    "- No expliques nada. Sin comentarios. Sin Markdown. SOLO JSON.\n"
    "- Si la pregunta requiere datos estructurados (leads, contactos, citas, etc.), usa \"mongo\".\n"
    "- Si la pregunta es de conocimiento/documentos (políticas, respuestas frecuentes), usa \"chroma\".\n"
    "- Si aplica ambos, usa \"both\"."
    "- Si la pregunta es sobre información no estructurada (ej. direcciones, historia, políticas, respuestas frecuentes, documentación, citas, servicios, reservas, informacion de clientes), usa \"chroma\"."
    "- ejemplo que servicios ha solicitado marcela ortiz utiliza chroma"
    "- Ejemplo: \"¿Cuál es la dirección de la sede suramericana?\" → { \"source\": \"chroma\", \"chroma\": {\"text\": \"direccion sede suramericana\", \"limit\": 5}, \"mongo\": [] }"
)


def _schema_summary(schema_json: Dict[str, Any]) -> str:
    lines = ["Bases de datos y colecciones disponibles:"]
    for db_name, collections in schema_json.items():
        if not isinstance(collections, dict):
            continue
        lines.append(f"- {db_name}:")
        for col_name, spec in collections.items():
            fields = spec.get("fields") or []
            fields_preview = ", ".join(map(str, fields[:12]))
            lines.append(f" • {col_name} (campos: {fields_preview}{' ...' if len(fields)>12 else ''})")
    return "\n".join(lines)


# ---------- Public API ----------

def query_generator(user_prompt: str) -> dict:
    """Generate validated queries dict for rag_search.execute_queries()."""

    schema_json = load_schema_examples()
    fields_map = allowed_fields_map(schema_json)

    client = OpenAI()
    model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

    user_content = (
        _schema_summary(schema_json)
        + "\n\n"
        "Instrucciones:\n"
        "- Escoge correctamente 'source' según la pregunta.\n"
        "- Para Mongo, usa solo los nombres de base/colección y campos listados arriba.\n"
        "- El filtro debe ser un objeto compatible con Mongo (puede incluir $eq, $gte, $in, $regex, $exists).\n"
        "- Límite por defecto 50 si no se especifica.\n"
        f"\nPregunta del usuario: {user_prompt}\n"
        "Responde SOLO con el JSON del esquema indicado.\n"
        "- Si la pregunta es sobre información no estructurada (ej. direcciones, historia, políticas, respuestas frecuentes, documentación, citas, servicios), usa \"chroma\".\n"
        "Ejemplo: \"¿Cuál es la dirección de la sede suramericana?\" → { \"source\": \"chroma\", \"chroma\": {\"text\": \"direccion sede suramericana\", \"limit\": 5}, \"mongo\": [] }"
        )

    print(f"LLM input:\n{user_content}\n")

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw = resp.choices[0].message.content
    except Exception as e:
        # Hard fallback: no queries
        return {
            "source": "mongo",
            "mongo": [],
            "chroma": None,
            "error": f"LLM error: {e}"
        }

    # Parse + validate
    try:
        data = json.loads(raw)
    except Exception as e:
        return {
            "source": "mongo",
            "mongo": [],
            "chroma": None,
            "error": f"JSON parse error: {e}",
            "raw": raw
        }

    # Pydantic validation
    try:
        bundle = QueriesBundle(**data)
    except ValidationError as e:
        return {
            "source": "mongo",
            "mongo": [],
            "chroma": None,
            "error": f"Schema validation error: {e}",
            "raw": data
        }

    # Sanitize filters/sorts against known fields
    sanitized_mongo: List[Dict[str, Any]] = []
    for q in bundle.mongo:
        allowed_fields = fields_map.get((q.database, q.collection), [])
        clean_filter = sanitize_filter(q.filter, allowed_fields) if allowed_fields else q.filter
        clean_sort = sanitize_sort(q.sort, allowed_fields) if allowed_fields else q.sort
        sanitized_mongo.append({
            "database": q.database,
            "collection": q.collection,
            "filter": clean_filter or {},  # never None
            "sort": clean_sort,
            "limit": q.limit,
        })

    out = {
        "source": bundle.source,
        "mongo": sanitized_mongo,
        "chroma": bundle.chroma.model_dump() if bundle.chroma else None
    }
    return out
