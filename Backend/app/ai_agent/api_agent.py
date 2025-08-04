# from fastapi import APIRouter
# from pydantic import BaseModel
# from app.ai_agent.agentv2 import UltraGenerativeAgent  # Ajusta el import si es necesario

# router = APIRouter()
# agent = UltraGenerativeAgent()

# class QueryRequest(BaseModel):
#     query: str

# @router.post("/query")
# def query_agent(request: QueryRequest):
#     """Procesar consulta al UltraGenerativeAgent."""
#     response = agent.process(request.query)
#     return {"query": request.query, "response": response}

# @router.get("/status")
# def get_agent_status():
#     """Obtener estado del UltraGenerativeAgent."""
#     return {"status": agent.get_status()}
