from app.ai_agent.db_clients import mongo_client, chroma_collections
import os
import json
from typing import Dict, List, Any, Optional

# ========= Config por ENV =========
def _get_int_env(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except Exception:
        return default

MAX_MONGO_LIMIT = _get_int_env("MAX_MONGO_LIMIT", 5000)
DEFAULT_MONGO_LIMIT = _get_int_env("DEFAULT_MONGO_LIMIT", 500)
MAX_CHROMA_LIMIT = _get_int_env("MAX_CHROMA_LIMIT", 2000)
DEFAULT_CHROMA_K = _get_int_env("DEFAULT_CHROMA_K", 100)
CHROMA_MAX_DOC_LENGTH = _get_int_env("CHROMA_MAX_DOC_LENGTH", 800)   # truncado amable
AGG_SHOW_LIMIT = _get_int_env("AGG_SHOW_LIMIT", 200)                 # docs a devolver en respuesta

def _mongo_search_single_optimized(mongo_entry: Dict[str, Any]) -> List[Dict[str, Any]]:
    results = []
    db_name = mongo_entry.get("database")
    coll_name = mongo_entry.get("collection")
    operation = mongo_entry.get("operation", "find")  # find | count_documents | aggregate
    filt = mongo_entry.get("filter", {}) or {}
    sort = mongo_entry.get("sort")
    limit = mongo_entry.get("limit", DEFAULT_MONGO_LIMIT)
    skip = mongo_entry.get("skip", 0)
    fields = mongo_entry.get("fields")
    pipeline = mongo_entry.get("pipeline", [])

    # compat legado
    if mongo_entry.get("count", False):
        operation = "count_documents"

    if not db_name:
        return results

    db = mongo_client[db_name]
    if coll_name:
        try:
            coll = db[coll_name]
            result_key = f"{db_name}.{coll_name}"

            if operation == "count_documents":
                count = coll.count_documents(filt)
                results.append({
                    result_key: {"operation": "count", "count": count, "filter_applied": filt}
                })

            elif operation == "aggregate":
                pipe = list(pipeline) if pipeline else [{"$match": filt}]
                # Paginación opcional si no viene en pipeline
                has_limit = any("$limit" in p for p in pipe)
                has_skip = any("$skip" in p for p in pipe)
                if not has_skip and skip:
                    pipe.append({"$skip": skip})
                if not has_limit and limit:
                    pipe.append({"$limit": min(limit, MAX_MONGO_LIMIT)})
                agg_results = list(coll.aggregate(pipe, allowDiskUse=True))

                # Mostrar hasta AGG_SHOW_LIMIT para no rebosar respuesta, pero conservar totales
                limited_results = agg_results[:AGG_SHOW_LIMIT]
                results.append({
                    result_key: {
                        "operation": "aggregate",
                        "results": limited_results,
                        "total_found": len(agg_results),
                        "showing": len(limited_results),
                        "page": {"skip": skip, "limit": limit}
                    }
                })

            else:  # find
                projection = {"_id": 0}
                if fields:
                    projection.update(fields)
                cur = coll.find(filt, projection)
                if sort:
                    cur = cur.sort(list(sort.items()))
                if skip:
                    cur = cur.skip(skip)
                cur = cur.limit(min(limit, MAX_MONGO_LIMIT))
                docs = list(cur)
                results.append({
                    result_key: {
                        "operation": "find",
                        "documents": docs,
                        "count": len(docs),
                        "page": {"skip": skip, "limit": limit}
                    }
                })

        except Exception as e:
            results.append({f"{db_name}.{coll_name}": {"operation": operation, "error": str(e), "filter": filt}})
    else:
        try:
            for cname in db.list_collection_names():
                try:
                    coll = db[cname]
                    result_key = f"{db_name}.{cname}"
                    if operation == "count_documents":
                        count = coll.count_documents(filt)
                        results.append({result_key: {"operation": "count", "count": count}})
                    else:
                        cur = coll.find(filt, {"_id": 0}).limit(50)  # por colección
                        docs = list(cur)
                        results.append({result_key: {"operation": "find", "documents": docs, "count": len(docs)}})
                except Exception as e:
                    results.append({result_key: {"error": str(e)}})
        except Exception as e:
            results.append({f"{db_name}": {"error": str(e)}})
    return results

def _process_chroma_results(raw_results: Dict, collection_name: str) -> Dict[str, Any]:
    if not raw_results.get("documents") or not raw_results["documents"][0]:
        return {"documents": [], "count": 0}

    documents = raw_results["documents"][0]
    metadatas = raw_results.get("metadatas", [{}])[0] if raw_results.get("metadatas") else [{}] * len(documents)
    distances = raw_results.get("distances", [{}])[0] if raw_results.get("distances") else [0] * len(documents)

    processed = []
    for i, doc in enumerate(documents):
        txt = doc[:CHROMA_MAX_DOC_LENGTH] + ("..." if len(doc) > CHROMA_MAX_DOC_LENGTH else "")
        processed.append({
            "content": txt,
            "metadata": metadatas[i] if i < len(metadatas) else {},
            "similarity": 1 - distances[i] if i < len(distances) else 0,
            "collection": collection_name
        })
    return {"documents": processed, "count": len(processed), "collection": collection_name}

def _chroma_search_optimized(chroma_query: Dict[str, Any]) -> Dict[str, Any]:
    if not chroma_query or not chroma_query.get("text"):
        return {}
    text = chroma_query["text"]
    limit = min(max(1, chroma_query.get("limit", DEFAULT_CHROMA_K)), MAX_CHROMA_LIMIT)

    chroma_results = {}
    for name, collection in chroma_collections.items():
        try:
            res = collection.query(query_texts=[text], n_results=limit)
            chroma_results[name] = _process_chroma_results(res, name)
        except Exception as e:
            chroma_results[name] = {"error": str(e)}
    return chroma_results

def _format_results_summary(results: Dict[str, Any], source: str) -> str:
    if source == "mongo":
        parts = []
        for key, data in results.items():
            if isinstance(data, dict):
                if data.get("operation") == "count":
                    parts.append(f"📊 {key}: {data.get('count', 0)} registros")
                elif data.get("operation") == "aggregate":
                    parts.append(f"📈 {key}: {data.get('total_found', 0)} resultados (mostrando {data.get('showing', 0)})")
                elif data.get("operation") == "find":
                    parts.append(f"📋 {key}: {data.get('count', 0)} documentos")
                elif "error" in data:
                    parts.append(f"❌ {key}: Error - {data['error']}")
        return "\n".join(parts)
    elif source == "chroma":
        parts = []
        for collection, data in results.items():
            if isinstance(data, dict) and "documents" in data:
                parts.append(f"🔍 {collection}: {data.get('count', 0)} documentos relevantes")
        return "\n".join(parts)
    return "Sin resultados"

def _has_meaningful_results(mongo_results: Dict[str, Any]) -> bool:
    if not mongo_results:
        return False
    for _, data in mongo_results.items():
        if not isinstance(data, dict): 
            continue
        if data.get("count", 0) > 0: return True
        if data.get("documents"): return True
        if data.get("results"): return True
    return False

def execute_queries_optimized(queries: dict) -> dict:
    out = {"chosen_source": None, "mongo": {}, "chroma": None, "summary": "", "optimized": True}

    source = queries.get("source", "mongo")
    mongo_queries = queries.get("mongo", []) or []
    chroma_query = queries.get("chroma")

    mongo_results = {}
    chroma_results = {}

    if source in ["mongo", "both"]:
        for m in mongo_queries:
            if not m: 
                continue
            items = _mongo_search_single_optimized(m)
            for it in items:
                mongo_results.update(it)

    if source == "mongo":
        out["chosen_source"] = "mongo"
        out["mongo"] = mongo_results
        out["summary"] = _format_results_summary(mongo_results, "mongo")
        if not _has_meaningful_results(mongo_results) and chroma_query:
            chroma_results = _chroma_search_optimized(chroma_query)
            out["chosen_source"] = "chroma"
            out["chroma"] = chroma_results
            out["summary"] = _format_results_summary(chroma_results, "chroma")
        return out

    if source == "chroma":
        chroma_results = _chroma_search_optimized(chroma_query)
        out["chosen_source"] = "chroma"
        out["chroma"] = chroma_results
        out["summary"] = _format_results_summary(chroma_results, "chroma")
        return out

    if source == "both":
        if _has_meaningful_results(mongo_results):
            out["chosen_source"] = "mongo"
            out["mongo"] = mongo_results
            out["summary"] = _format_results_summary(mongo_results, "mongo")
        else:
            chroma_results = _chroma_search_optimized(chroma_query)
            out["chosen_source"] = "chroma" if chroma_results else "none"
            out["chroma"] = chroma_results
            out["summary"] = _format_results_summary(chroma_results, "chroma")
        return out

    out["chosen_source"] = "none"
    out["summary"] = "No se encontraron resultados"
    return out

# Wrapper compat
def execute_queries(queries: dict) -> dict:
    return execute_queries_optimized(queries)

