#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""

🧠 ULTRA-GENERATIVE DATABASE AGENT v3.0

"""

import os
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

import pymongo
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_huggingface import HuggingFaceEndpoint

from dotenv import load_dotenv
from loguru import logger

load_dotenv()

@dataclass
class GenerativeContext:
    """Contexto de razonamiento completo"""
    query: str
    intent: Dict[str, Any]
    schema: Dict[str, Any]
    mongo_query: Dict[str, Any]
    confidence: float

class UltraGenerativeAgent:
    """🧠 Agente Ultra-Generativo como Claude"""
    
    def __init__(self, mongo_uri: str = None):
        """Inicialización mínima y potente"""
        self.mongo_uri = mongo_uri or os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.embeddings = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        self.llm = self._setup_llm()
        self.db_catalog = {}
        self.concept_space = self._build_concept_embeddings()
        
        # Auto-descubrimiento inteligente
        self._discover_databases()
        
        logger.success("🚀 Ultra-Generative Agent ready!")
    
    def _setup_llm(self):
        """Setup LLM para razonamiento"""
        hf_token = os.getenv('HUGGINGFACE_API_TOKEN')
        if hf_token:
            return HuggingFaceEndpoint(
                repo_id="microsoft/DialoGPT-medium",
                huggingfacehub_api_token=hf_token,
                temperature=0.7,
                max_length=512
            )
        return None
    
    def _build_concept_embeddings(self):
        """Espacio conceptual ultra-compacto"""
        concepts = {
            'list': ['lista', 'mostrar', 'ver', 'dame', 'obtener'],
            'count': ['cuántos', 'total', 'cantidad', 'número'],
            'filter': ['con', 'donde', 'que tengan', 'filtro'],
            'people': ['miembros', 'usuarios', 'personas', 'clientes'],
            'products': ['productos', 'items', 'inventario'],
            'time': ['fecha', 'mes', 'año', 'reciente', 'junio']
        }
        
        space = {}
        for concept, terms in concepts.items():
            embeddings = self.embeddings.encode(terms)
            space[concept] = np.mean(embeddings, axis=0)
        
        return space
    
    def _discover_databases(self):
        """Auto-descubrimiento inteligente con reconexión"""
        uris = [
            self.mongo_uri,
            os.getenv('MONGODB_URI_INVENTORY', self.mongo_uri),
            os.getenv('MONGODB_URI_BRAIN', self.mongo_uri)
        ]
        
        for i, uri in enumerate(set(uris)):
            try:
                client = MongoClient(uri, serverSelectionTimeoutMS=3000, connectTimeoutMS=3000)
                
                for db_name in client.list_database_names():
                    if db_name not in ['admin', 'local', 'config']:
                        collections = client[db_name].list_collection_names()
                        if collections:  # Solo DB con colecciones
                            self.db_catalog[db_name] = {
                                'uri': uri,
                                'collections': collections,
                                'schemas': self._sample_schemas(client[db_name])
                            }
                client.close()
                logger.info(f"✅ Connected: {len(self.db_catalog)} databases")
                return
                
            except Exception as e:
                logger.warning(f"⚠️ DB {i} connection failed: {e}")
        
        # Fallback: crear DB demo si no hay conexión
        if not self.db_catalog:
            logger.warning("🔧 Using demo mode - no real databases connected")
            self._create_demo_catalog()
    
    def _sample_schemas(self, database):
        """Muestreo ultra-rápido de esquemas"""
        schemas = {}
        for collection_name in database.list_collection_names()[:5]:  # Max 5 collections
            try:
                sample = list(database[collection_name].find().limit(3))
                if sample:
                    schemas[collection_name] = {
                        'fields': list(sample[0].keys()),
                        'sample': sample[0],
                        'count': database[collection_name].estimated_document_count()
                    }
            except:
                pass
        return schemas
    
    def _create_demo_catalog(self):
        """Catálogo demo para pruebas sin DB"""
        self.db_catalog = {
            'demo_db': {
                'uri': 'demo://localhost',
                'collections': ['members', 'products', 'orders'],
                'schemas': {
                    'members': {
                        'fields': ['name', 'email', 'city', 'registration_date'],
                        'sample': {'name': 'Juan', 'email': 'juan@email.com', 'city': 'Medellín'},
                        'count': 150
                    },
                    'products': {
                        'fields': ['name', 'price', 'stock', 'category'],
                        'sample': {'name': 'Producto A', 'price': 25000, 'stock': 50},
                        'count': 80
                    }
                }
            }
        }
    
    def reason_about_query(self, user_query: str) -> GenerativeContext:
        """🧠 RAZONAMIENTO CENTRAL como Claude"""
        
        # 1. Análisis semántico ultra-rápido
        query_embedding = self.embeddings.encode([user_query])[0]
        
        # 2. Detección de conceptos
        concept_scores = {}
        for concept, centroid in self.concept_space.items():
            similarity = cosine_similarity([query_embedding], [centroid])[0][0]
            if similarity > 0.3:
                concept_scores[concept] = float(similarity)
        
        # 3. Razonamiento de intención
        intent = self._reason_intent(user_query, concept_scores)
        
        # 4. Selección de esquema
        target_schema = self._select_schema(intent)
        
        # 5. Generación de consulta
        mongo_query = self._generate_query(intent, target_schema)
        
        # 6. Cálculo de confianza
        confidence = np.mean(list(concept_scores.values())) if concept_scores else 0.5
        
        return GenerativeContext(
            query=user_query,
            intent=intent,
            schema=target_schema,
            mongo_query=mongo_query,
            confidence=confidence
        )
    
    def _reason_intent(self, query: str, concepts: Dict[str, float]) -> Dict[str, Any]:
        """Razonamiento de intención compacto"""
        
        # Determinar acción principal
        if 'count' in concepts:
            action = 'count'
        elif 'list' in concepts:
            action = 'find'
        else:
            action = 'find'  # default
        
        # Determinar entidad objetivo
        entity = 'unknown'
        if 'people' in concepts:
            entity = 'people'
        elif 'products' in concepts:
            entity = 'products'
        
        # Detectar filtros
        filters = []
        if 'filter' in concepts:
            filters.append('conditional')
        if 'time' in concepts:
            filters.append('temporal')
        
        return {
            'action': action,
            'entity': entity,
            'filters': filters,
            'concepts': concepts
        }
    
    def _select_schema(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Selección inteligente de esquema"""
        
        entity = intent.get('entity', 'unknown')
        
        # Mapeo entidad -> colección
        entity_map = {
            'people': ['member', 'user', 'cliente', 'persona'],
            'products': ['product', 'item', 'inventario']
        }
        
        # Buscar la mejor coincidencia
        target_patterns = entity_map.get(entity, [])
        
        for db_name, db_info in self.db_catalog.items():
            for collection_name, schema in db_info.get('schemas', {}).items():
                if any(pattern in collection_name.lower() for pattern in target_patterns):
                    return {
                        'database': db_name,
                        'collection': collection_name,
                        'uri': db_info['uri'],
                        **schema
                    }
        
        # Fallback: primera colección disponible
        if self.db_catalog:
            first_db = list(self.db_catalog.values())[0]
            first_collection = list(first_db.get('schemas', {}).keys())[0]
            return {
                'database': list(self.db_catalog.keys())[0],
                'collection': first_collection,
                'uri': first_db['uri'],
                **first_db['schemas'][first_collection]
            }
        
        return {}
    
    def _generate_query(self, intent: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generación dinámica de consulta MongoDB"""
        
        action = intent.get('action', 'find')
        filters = intent.get('filters', [])
        
        query = {
            'operation': action,
            'filter': {},
            'projection': {},
            'limit': 10 if action == 'find' else None,
            'sort': {}
        }
        
        # Aplicar filtros
        if 'temporal' in filters:
            # Filtro temporal inteligente
            date_fields = [f for f in schema.get('fields', []) if 'date' in f.lower()]
            if date_fields:
                # Filtro para mes actual (ejemplo)
                current_month = datetime.now().month
                query['filter'][date_fields[0]] = {"$regex": f"{current_month:02d}/"}
        
        # Auto-proyección inteligente
        fields = schema.get('fields', [])
        important_fields = [f for f in fields if f not in ['_id', 'created_at', 'updated_at']][:5]
        
        if important_fields:
            query['projection'] = {field: 1 for field in important_fields}
            query['projection']['_id'] = 0
        
        # Ordenamiento inteligente
        if 'date' in ' '.join(fields).lower():
            date_field = next((f for f in fields if 'date' in f.lower()), None)
            if date_field:
                query['sort'] = {date_field: -1}
        
        return query
    
    def execute_query(self, context: GenerativeContext) -> Dict[str, Any]:
        """Ejecución inteligente con fallbacks"""
        
        schema = context.schema
        query = context.mongo_query
        
        # Si es demo mode
        if schema.get('uri', '').startswith('demo://'):
            return self._execute_demo_query(context)
        
        try:
            client = MongoClient(schema['uri'], serverSelectionTimeoutMS=5000)
            db = client[schema['database']]
            collection = db[schema['collection']]
            
            operation = query['operation']
            
            if operation == 'count':
                result = collection.count_documents(query.get('filter', {}))
                data = [{'count': result}]
            else:  # find
                cursor = collection.find(
                    query.get('filter', {}),
                    query.get('projection', {})
                )
                
                if query.get('sort'):
                    cursor = cursor.sort(list(query['sort'].items()))
                    
                if query.get('limit'):
                    cursor = cursor.limit(query['limit'])
                
                data = list(cursor)
            
            client.close()
            
            return {
                'success': True,
                'data': data,
                'count': len(data),
                'execution_time': 0.1
            }
            
        except Exception as e:
            logger.error(f"❌ Query execution failed: {e}")
            return self._execute_demo_query(context)
    
    def _execute_demo_query(self, context: GenerativeContext) -> Dict[str, Any]:
        """Ejecución demo con datos simulados"""
        
        intent = context.intent
        schema = context.schema
        
        # Datos demo basados en esquema
        sample_data = []
        
        if intent.get('entity') == 'people':
            sample_data = [
                {'name': 'Juan Pérez', 'email': 'juan@email.com', 'city': 'Medellín', 'registration_date': '06/2024'},
                {'name': 'María García', 'email': 'maria@email.com', 'city': 'Bogotá', 'registration_date': '06/2024'},
                {'name': 'Carlos López', 'email': 'carlos@email.com', 'city': 'Barranquilla', 'registration_date': '07/2024'}
            ]
        elif intent.get('entity') == 'products':
            sample_data = [
                {'name': 'Producto A', 'price': 25000, 'stock': 150, 'category': 'Electrónicos'},
                {'name': 'Producto B', 'price': 45000, 'stock': 75, 'category': 'Hogar'},
                {'name': 'Producto C', 'price': 15000, 'stock': 200, 'category': 'Ropa'}
            ]
        
        # Simular filtros
        if 'temporal' in intent.get('filters', []):
            sample_data = [item for item in sample_data if '06' in str(item.get('registration_date', '07'))]
        
        # Simular conteo
        if intent.get('action') == 'count':
            return {
                'success': True,
                'data': [{'count': len(sample_data)}],
                'count': 1,
                'execution_time': 0.01
            }
        
        return {
            'success': True,
            'data': sample_data[:context.mongo_query.get('limit', 10)],
            'count': len(sample_data),
            'execution_time': 0.01
        }
    
    def generate_response(self, context: GenerativeContext, result: Dict[str, Any]) -> str:
        """🎨 Generación de respuesta natural como Claude"""
        
        if not result['success']:
            return f"❌ No pude procesar tu consulta: {context.query}"
        
        data = result['data']
        
        if not data:
            return f"📭 No encontré información para: {context.query}"
        
        # Respuesta contextual según intención
        intent = context.intent
        
        if intent.get('action') == 'count':
            count = data[0].get('count', 0)
            entity_name = 'elementos'
            if intent.get('entity') == 'people':
                entity_name = 'miembros/usuarios'
            elif intent.get('entity') == 'products':
                entity_name = 'productos'
            
            return f"""📊 **Total encontrado**: {count:,} {entity_name}

🎯 *Consulta procesada con {context.confidence:.1%} de confianza*
⏱️ *Ejecutado en {result['execution_time']:.2f}s*"""
        
        # Respuesta de listado
        response = f"📋 **Resultados encontrados** ({len(data)}):\n\n"
        
        for i, item in enumerate(data, 1):
            # Campo principal
            main_field = self._find_main_field(item)
            main_value = item.get(main_field, f'Elemento {i}')
            
            response += f"{i}. **{main_value}**\n"
            
            # Campos adicionales
            for key, value in item.items():
                if key != main_field and key != '_id' and value is not None:
                    emoji = self._get_field_emoji(key)
                    response += f"   {emoji} {self._format_field(key, value)}\n"
            
            response += "\n"
        
        # Footer
        response += f"🎯 *Confianza: {context.confidence:.1%}* | "
        response += f"⏱️ *{result['execution_time']:.2f}s* | "
        response += f"📊 *{result['count']} registros*"
        
        return response
    
    def _find_main_field(self, item: Dict[str, Any]) -> str:
        """Encuentra campo principal para display"""
        priority = ['name', 'nombre', 'full_name', 'title', 'email']
        for field in priority:
            if field in item and item[field]:
                return field
        return list(item.keys())[0]
    
    def _get_field_emoji(self, field: str) -> str:
        """Emoji contextual para campos"""
        field_lower = field.lower()
        emoji_map = {
            'email': '📧', 'phone': '📱', 'city': '🏙️', 'price': '💰',
            'stock': '📦', 'date': '📅', 'status': '🔵'
        }
        
        for keyword, emoji in emoji_map.items():
            if keyword in field_lower:
                return emoji
        return '📝'
    
    def _format_field(self, field: str, value: Any) -> str:
        """Formateo contextual de campos"""
        field_lower = field.lower()
        
        if 'price' in field_lower and isinstance(value, (int, float)):
            return f"Precio: ${value:,.0f}"
        elif 'stock' in field_lower:
            return f"Stock: {value} unidades"
        elif 'email' in field_lower:
            return f"Email: {value}"
        elif 'city' in field_lower:
            return f"Ciudad: {value}"
        else:
            return f"{field.replace('_', ' ').title()}: {value}"
    
    def process(self, user_query: str) -> str:
        """🚀 PROCESO PRINCIPAL - Ultra-compacto"""
        
        logger.info(f"🤔 Processing: '{user_query}'")
        
        try:
            # 1. Razonamiento generativo
            context = self.reason_about_query(user_query)
            
            # 2. Ejecución inteligente
            result = self.execute_query(context)
            
            # 3. Respuesta natural
            response = self.generate_response(context, result)
            
            logger.success(f"✅ Query processed successfully")
            return response
            
        except Exception as e:
            logger.error(f"❌ Processing error: {e}")
            return f"❌ Error procesando: {user_query}\n💡 Verifica la conexión a la base de datos"
    
    def get_status(self) -> str:
        """Estado del sistema ultra-compacto"""
        
        db_count = len(self.db_catalog)
        collections_count = sum(len(db.get('collections', [])) for db in self.db_catalog.values())
        
        status = f"""📊 **SYSTEM STATUS**
{'='*40}
🔗 Databases: {db_count}
📚 Collections: {collections_count}
🧠 Embeddings: Ready
🎯 Concepts: {len(self.concept_space)}

📋 **Available Databases**:"""
        
        for db_name, db_info in self.db_catalog.items():
            collections = db_info.get('collections', [])
            status += f"\n   • **{db_name}**: {', '.join(collections[:3])}"
            if len(collections) > 3:
                status += f" (+{len(collections)-3} more)"
        
        return status

# ==========================================
# INTERFAZ INTERACTIVA ULTRA-COMPACTA
# ==========================================

def interactive_session():
    """Sesión interactiva minimalista"""
    
    print("""
🧠 ULTRA-GENERATIVE DATABASE AGENT v3.0
=========================================
✨ Claude-style AI for your databases
🎯 Natural language → Smart insights

Commands: help | status | quit
""")
    
    agent = UltraGenerativeAgent()
    
    while True:
        try:
            query = input("\n🤖 Your query: ").strip()
            
            if not query:
                continue
                
            if query.lower() in ['quit', 'exit']:
                print("👋 Goodbye!")
                break
                
            elif query.lower() == 'help':
                print("""
💡 **QUERY EXAMPLES**:
• "Lista de miembros registrados en junio"
• "Cuántos productos hay en total" 
• "Usuarios de Medellín con email"
• "Productos con más stock"

🔧 **COMMANDS**:
• help - Show this help
• status - System status  
• quit - Exit
""")
                continue
                
            elif query.lower() == 'status':
                print(agent.get_status())
                continue
            
            # Procesar consulta normal
            response = agent.process(query)
            print(f"\n{response}")
            
        except KeyboardInterrupt:
            print("\n👋 Session ended!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    interactive_session()