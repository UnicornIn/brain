# rag_search.py
from app.ai_agent.db_clients import mongo_client, chroma_collection

def _mongo_search_single(mongo_entry):
    results = []
    db_name = mongo_entry.get("database")
    coll_name = mongo_entry.get("collection")
    filt = mongo_entry.get("filter", {}) or {}

    if not db_name:
        return results

    db = mongo_client[db_name]
    if coll_name:
        # search only that collection
        try:
            docs = list(db[coll_name].find(filt, {"_id": 0}))
            results.append({f"{db_name}.{coll_name}": docs})
        except Exception as e:
            results.append({f"{db_name}.{coll_name}": {"error": str(e)}})
    else:
        # iterate all collections in the database
        try:
            for cname in db.list_collection_names():
                try:
                    docs = list(db[cname].find(filt, {"_id": 0}))
                    results.append({f"{db_name}.{cname}": docs})
                except Exception as e:
                    results.append({f"{db_name}.{cname}": {"error": str(e)}})
        except Exception as e:
            results.append({f"{db_name}": {"error": str(e)}})
    return results

def execute_queries(queries: dict) -> dict:
    out = {"mongo": {}, "chroma": None}

    # Mongo
    for m in queries.get("mongo", []) or []:
        if not m:
            continue
        items = _mongo_search_single(m)
        for it in items:
            out["mongo"].update(it)

    # Chroma
    c = queries.get("chroma")
    if c and c.get("text"):
        try:
            chroma_res = chroma_collection.query(
                query_texts=[c["text"]],
                n_results=c.get("limit", 5)
            )
            # Extraer solo la lista de resultados para simplificar la salida
            out["chroma"] = chroma_res.get("results", chroma_res)
        except Exception as e:
            out["chroma"] = {"error": str(e)}

    return out