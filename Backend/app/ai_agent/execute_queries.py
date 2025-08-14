from db_clients import mongo_client, chroma_collection

def execute_queries(queries: dict):
    results = {"mongo": {}, "chroma": None}

    # === Ejecutar en Mongo ===
    if queries.get("mongo"):
        for q in queries["mongo"]:
            db_name = q.get("database")
            col_name = q.get("collection")
            filt = q.get("filter", {}) or {}
            sort = q.get("sort")    # espera dict {campo: 1/-1}
            limit = q.get("limit")  # espera int

            if db_name and col_name:
                try:
                    collection = mongo_client[db_name][col_name]
                    cursor = collection.find(filt, {"_id": 0})

                    if sort and isinstance(sort, dict):
                        sort_list = [(k, v) for k, v in sort.items()]
                        cursor = cursor.sort(sort_list)

                    if limit and isinstance(limit, int):
                        cursor = cursor.limit(limit)

                    docs = list(cursor)
                    results["mongo"][f"{db_name}.{col_name}"] = docs
                except Exception as e:
                    results["mongo"][f"{db_name}.{col_name}"] = {"error": str(e)}

    # === Ejecutar en Chroma ===
    if queries.get("chroma") and queries["chroma"].get("text"):
        try:
            chroma_results = chroma_collection.query(
                query_texts=[queries["chroma"]["text"]],
                n_results=queries["chroma"].get("limit", 5)
            )
            results["chroma"] = chroma_results
        except Exception as e:
            results["chroma"] = {"error": str(e)}

    return results





