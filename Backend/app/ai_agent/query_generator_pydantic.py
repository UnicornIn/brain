import os
import json
import re
import unicodedata
from datetime import datetime
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field, ValidationError
from openai import OpenAI

# ========= Config por ENV =========
def _get_int_env(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except Exception:
        return default

# LÍMITES CONFIGURABLES
MAX_MONGO_LIMIT = _get_int_env("MAX_MONGO_LIMIT", 5000)          # tope duro Mongo
DEFAULT_MONGO_LIMIT = _get_int_env("DEFAULT_MONGO_LIMIT", 500)   # límite por defecto Mongo
MAX_CHROMA_LIMIT = _get_int_env("MAX_CHROMA_LIMIT", 2000)        # tope duro Chroma
DEFAULT_CHROMA_K = _get_int_env("DEFAULT_CHROMA_K", 100)         # n_results por defecto Chroma

# ========= Modelos =========
class ChromaQuery(BaseModel):
    text: str
    limit: int = Field(default=DEFAULT_CHROMA_K, ge=1, le=MAX_CHROMA_LIMIT)

class MongoQuery(BaseModel):
    database: str
    collection: str
    operation: str = Field(default="find")  # find | count_documents | aggregate
    filter: Dict[str, Any] = Field(default_factory=dict)
    fields: Optional[Dict[str, int]] = None
    sort: Optional[Dict[str, int]] = None
    limit: int = Field(default=DEFAULT_MONGO_LIMIT, ge=1, le=MAX_MONGO_LIMIT)
    skip: int = Field(default=0, ge=0)  # NUEVO: paginación
    pipeline: Optional[List[Dict[str, Any]]] = None  # para aggregate

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
                        field_map[f] = "string"
                    elif isinstance(f, dict):
                        for k, v in f.items():
                            field_map[k] = v
            elif isinstance(fields, dict):
                field_map.update(fields)
            out[(db_name, col_name)] = field_map
    return out

SAFE_MONGO_OPS = {
    "$eq", "$ne", "$gt", "$gte", "$lt", "$lte",
    "$in", "$nin", "$regex", "$exists", "$count"
}

def normalize_date(value: str) -> str:
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(value, fmt)
            return dt.strftime("%d/%m/%Y")
        except ValueError:
            continue
    return value

def accent_insensitive_regex(text: str) -> str:
    ACCENT_GROUPS = {
        "a": "aàáâäãåāăą", "e": "eèéêëēĕėęě",
        "i": "iìíîïīĭįı", "o": "oòóôöõōŏő",
        "u": "uùúûüũūŭůűų", "c": "cçćĉċč",
        "n": "nñńņňŉŋ", "y": "yýÿŷ",
    }
    parts = []
    for ch in text:
        if unicodedata.category(ch) == "Mn":
            continue
        base = unicodedata.normalize("NFD", ch)[0].lower()
        if base in ACCENT_GROUPS:
            parts.append("[" + re.escape(ACCENT_GROUPS[base]) + "]")
        else:
            parts.append(re.escape(ch))
    return f"(?i){''.join(parts)}"

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
                            clean[k] = {"$regex": accent_insensitive_regex(v), "$options": "i"}
                    elif isinstance(v, dict):
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

def sanitize_sort(sort_obj: Optional[Dict[str, int]], allowed_fields: Dict[str, str]) -> Optional[Dict[str, int]]:
    if not sort_obj:
        return None
    clean = {}
    for k, v in sort_obj.items():
        if k in allowed_fields and v in (-1, 1):
            clean[k] = v
    return clean or None

# ---------- LLM Prompting ----------
def _schema_summary(schema_json: Dict[str, Any]) -> str:
    lines = ["Bases de datos disponibles:"]
    for db_name, collections in schema_json.items():
        if not isinstance(collections, dict):
            continue
        lines.append(f"- {db_name}:")
        for col_name, spec in collections.items():
            fields = spec.get("fields") or []
            fields_preview = ", ".join(map(str, fields[:12]))
            lines.append(f"  • {col_name} (campos: {fields_preview}{' ...' if len(fields)>12 else ''})")
    return "\n".join(lines)

SYSTEM_PROMPT = (
    "Eres un generador de consultas para un CRM/BI.\n"
    "Devuelve SOLO un JSON con el esquema:\n"
    "{ 'source': 'mongo'|'chroma'|'both', "
    "'mongo': [ { 'database': str, 'collection': str, 'operation': 'find'|'count_documents'|'aggregate', "
    "'filter': obj, 'fields': obj?, 'sort': obj?, 'skip': int?, 'limit': int?, 'pipeline': []? } ], "
    "'chroma': { 'text': str, 'limit': int? }? }\n"
    "\n"
    "- Si piden KPIs, comparaciones de ventas, top-N de sucursales, % de métodos de pago, ranking o dashboards: usa **'chroma'** sobre la colección 'summary'.\n"
    "- Si piden registros transaccionales detallados (ventas individuales, clientes, inventario): usa 'mongo'.\n"
    "- Si piden información no estructurada (manuales, políticas, textos largos): usa 'chroma'.\n"
    "- Si necesitas combinar datos exactos con contexto semántico, usa 'both'.\n"
    "\n"
    "Muy importante: cuando la consulta es de tipo BI (KPIs agregados, totales por sucursal, etc.), prioriza siempre 'chroma'.\n"
)

def query_generator(user_prompt: str) -> dict:
    schema_json = load_schema_examples()
    fields_map = allowed_fields_map(schema_json)
    client = OpenAI()
    model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

    user_content = (
        _schema_summary(schema_json)
        + "\n\nInstrucciones:\n"
          "- Genera el mejor 'source'.\n"
          "- Para Mongo usa solo campos del schema. Usa 'skip/limit' y 'fields' cuando listados.\n"
          "- Para BI usa 'aggregate' con $match/$group/$project/$sort y paginación con $skip/$limit si hace falta.\n"
          "- Para Chroma permite 'limit' grande (por ENV) si la consulta lo amerita.\n"
        f"\nPregunta: {user_prompt}\n"
        "Responde SOLO con el JSON."
    )

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
        return {"source": "chroma", "mongo": [], "chroma": {"text": user_prompt, "limit": DEFAULT_CHROMA_K}, "error": f"LLM error: {e}"}

    try:
        data = json.loads(raw)
    except Exception as e:
        return {"source": "chroma", "mongo": [], "chroma": {"text": user_prompt, "limit": DEFAULT_CHROMA_K}, "error": f"JSON parse error: {e}", "raw": raw}

    try:
        bundle = QueriesBundle(**data)
    except ValidationError as e:
        return {"source": "chroma", "mongo": [], "chroma": {"text": user_prompt, "limit": DEFAULT_CHROMA_K}, "error": f"Schema validation error: {e}", "raw": data}

    # Sanitización final (SIN recortes duros)
    sanitized_mongo: List[Dict[str, Any]] = []
    fields_map_all = allowed_fields_map(schema_json)
    for q in bundle.mongo:
        allowed_fields_dict = fields_map_all.get((q.database, q.collection), {})
        clean_filter = sanitize_filter(q.filter, allowed_fields_dict) if allowed_fields_dict else q.filter
        clean_sort = sanitize_sort(q.sort, allowed_fields_dict) if allowed_fields_dict else q.sort

        lim = min(max(1, q.limit), MAX_MONGO_LIMIT)
        skp = max(0, q.skip)

        entry = {
            "database": q.database,
            "collection": q.collection,
            "operation": q.operation,
            "filter": clean_filter or {},
            "sort": clean_sort,
            "limit": lim,
            "skip": skp,
        }
        if q.fields: entry["fields"] = q.fields
        if q.pipeline: entry["pipeline"] = q.pipeline
        sanitized_mongo.append(entry)

    chroma_query = None
    if bundle.chroma:
        chroma_query = {
            "text": bundle.chroma.text,
            "limit": min(max(1, bundle.chroma.limit), MAX_CHROMA_LIMIT)
        }

    return {"source": bundle.source, "mongo": sanitized_mongo, "chroma": chroma_query}
