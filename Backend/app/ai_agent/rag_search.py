#rag_search.py
from app.ai_agent.db_clients import mongo_client, chroma_collection

def _mongo_search_single(mongo_entry):
    results = []
    db_name = mongo_entry.get("database")
    coll_name = mongo_entry.get("collection")
    filt = mongo_entry.get("filter", {}) or {}
    sort = mongo_entry.get("sort") or None
    limit = mongo_entry.get("limit") or None  # puede ser None
    do_count = mongo_entry.get("count", False)

    if not db_name:
        return results

    db = mongo_client[db_name]
    if coll_name:
        try:
            coll = db[coll_name]
            if do_count:
                # 👇 modo conteo
                count = coll.count_documents(filt)
                results.append({f"{db_name}.{coll_name}": {"count": count}})
            else:
                cursor = coll.find(filt, {"_id": 0})
                if sort:
                    cursor = cursor.sort(list(sort.items()))
                if limit:
                    cursor = cursor.limit(limit)
                docs = list(cursor)
                results.append({f"{db_name}.{coll_name}": docs})
        except Exception as e:
            results.append({f"{db_name}.{coll_name}": {"error": str(e)}})
    else:
        try:
            for cname in db.list_collection_names():
                try:
                    coll = db[cname]
                    if do_count:
                        count = coll.count_documents(filt)
                        results.append({f"{db_name}.{cname}": {"count": count}})
                    else:
                        cursor = coll.find(filt, {"_id": 0})
                        if sort:
                            cursor = cursor.sort(list(sort.items()))
                        if limit:
                            cursor = cursor.limit(limit)
                        docs = list(cursor)
                        results.append({f"{db_name}.{cname}": docs})
                except Exception as e:
                    results.append({f"{db_name}.{cname}": {"error": str(e)}})
        except Exception as e:
            results.append({f"{db_name}": {"error": str(e)}})
    return results


def execute_queries(queries: dict) -> dict:
    """
    Ejecuta queries con enrutamiento híbrido:
    - Si source = mongo → primero Mongo, si vacío y hay chroma, entonces fallback a Chroma.
    - Si source = chroma → solo Chroma.
    - Si source = both → primero Mongo, si vacío entonces Chroma.
    """
    out = {"chosen_source": None, "mongo": {}, "chroma": None}

    source = queries.get("source", "mongo")
    mongo_queries = queries.get("mongo", []) or []
    chroma_query = queries.get("chroma")

    mongo_results = {}
    chroma_results = None

    # Ejecutar Mongo si aplica
    if source in ["mongo", "both"]:
        for m in mongo_queries:
            if not m:
                continue
            items = _mongo_search_single(m)
            for it in items:
                mongo_results.update(it)

    # Caso solo Mongo con fallback a Chroma
    if source == "mongo":
        out["chosen_source"] = "mongo"
        out["mongo"] = mongo_results

        if not any(mongo_results.values()) and chroma_query and chroma_query.get("text"):
            try:
                chroma_res = chroma_collection.query(
                    query_texts=[chroma_query["text"]],
                    n_results=chroma_query.get("limit", 5)
                )
                chroma_results = chroma_res.get("results", chroma_res)
                out["chosen_source"] = "chroma"
                out["chroma"] = chroma_results
            except Exception as e:
                out["chroma"] = {"error": str(e)}

        return out

    # Caso solo Chroma
    if source == "chroma":
        if chroma_query and chroma_query.get("text"):
            try:
                chroma_res = chroma_collection.query(
                    query_texts=[chroma_query["text"]],
                    n_results=chroma_query.get("limit", 5)
                )
                chroma_results = chroma_res.get("results", chroma_res)
            except Exception as e:
                chroma_results = {"error": str(e)}
        out["chosen_source"] = "chroma"
        out["chroma"] = chroma_results
        return out

    # Caso BOTH → prioridad a Mongo si encontró docs
    if source == "both":
        if any(mongo_results.values()):
            out["chosen_source"] = "mongo"
            out["mongo"] = mongo_results
        else:
            if chroma_query and chroma_query.get("text"):
                try:
                    chroma_res = chroma_collection.query(
                        query_texts=[chroma_query["text"]],
                        n_results=chroma_query.get("limit", 5)
                    )
                    chroma_results = chroma_res.get("results", chroma_res)
                except Exception as e:
                    chroma_results = {"error": str(e)}
            out["chosen_source"] = "chroma" if chroma_results else "none"
            out["chroma"] = chroma_results
        return out

    out["chosen_source"] = "none"
    print(mongo_results)
    print(chroma_results)
    return out
