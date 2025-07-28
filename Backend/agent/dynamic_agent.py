#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🧠 SISTEMA IA DINÁMICO MULTI-DATABASE
Agente que funciona como Claude/GPT pero especializado en tus bases de datos
1. para ejecutar el proyecto primero instala las dependencias:
pip install -r requirements.txt
2. para ejecutar el agente:
3. si vas ejecutarlo procura tener en tu .env las variables de conexión a MongoDB:
MONGODB_URI=
MONGODB_DBNAME="DatabaseInvetary"
python dynamic_agent.py
Versión: 1.0 - Día 1 Completo
"""

import os
import re
import json
import asyncio
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path

# Core AI
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

# Database
import pymongo
from pymongo import MongoClient
import motor.motor_asyncio

# LangChain
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_huggingface import HuggingFaceEndpoint

# Utilities
from dotenv import load_dotenv
from loguru import logger
import requests

# Configuración inicial
load_dotenv()
logger.add("logs/dynamic_agent.log", rotation="1 MB", level="INFO")

@dataclass
class QueryIntent:
    """Estructura para intenciones de consulta"""
    intent_type: str
    confidence: float
    parameters: Dict[str, Any]
    collection: str
    description: str

@dataclass
class QueryResult:
    """Estructura para resultados de consulta"""
    success: bool
    data: List[Dict[str, Any]]
    query_info: Dict[str, Any]
    execution_time: float
    error_message: Optional[str] = None

class IntelligentEmbeddingEngine:
    """Motor de embeddings con clasificación inteligente de intenciones"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        logger.info(f"🚀 Inicializando EmbeddingEngine con modelo: {model_name}")
        
        try:
            self.model = SentenceTransformer(model_name)
            self.intent_database = {}
            self.intent_patterns = {}
            self._initialize_intent_system()
            logger.success("✅ EmbeddingEngine inicializado correctamente")
        except Exception as e:
            logger.error(f"❌ Error inicializando EmbeddingEngine: {e}")
            raise
    
    def _initialize_intent_system(self):
        """Inicializa el sistema de reconocimiento de intenciones"""
        
        # Patrones para inventario y stock
        inventory_patterns = [
            "productos con más stock", "productos con mayor stock", "stock alto",
            "productos con menos stock", "productos con menor stock", "stock bajo",
            "inventario completo", "lista de productos", "todos los productos",
            "productos disponibles", "stock actual", "inventario actual",
            "productos con mayor inventario", "productos con menor inventario",
            "top productos por stock", "productos mejor surtidos"
        ]
        
        # Patrones para análisis temporal
        temporal_patterns = [
            "pedidos por mes", "pedidos mensuales", "estadísticas mensuales",
            "cuántos pedidos en", "pedidos en el mes de", "resumen mensual",
            "pedidos del último mes", "pedidos recientes", "actividad mensual",
            "análisis temporal", "tendencia de pedidos", "historial de pedidos",
            "pedidos por período", "ventas mensuales", "actividad por mes"
        ]
        
        # Patrones para información general
        general_patterns = [
            "total de productos", "cuántos productos", "cantidad de productos",
            "resumen de inventario", "estadísticas generales", "información general",
            "overview del inventario", "datos generales", "estado del inventario",
            "conteo de productos", "sumario de productos"
        ]
        
        # Patrones para análisis detallado
        detail_patterns = [
            "productos por categoría", "análisis por tipo", "desglose detallado",
            "información completa", "detalles específicos", "análisis profundo",
            "datos específicos", "información detallada"
        ]
        
        # Generar embeddings para cada categoría
        self.intent_patterns = {
            'inventory_stock_query': {
                'embeddings': self.model.encode(inventory_patterns),
                'collection': 'DatabaseInvetary',
                'description': 'Consultas sobre stock e inventario de productos'
            },
            'temporal_analysis_query': {
                'embeddings': self.model.encode(temporal_patterns),
                'collection': 'orders',  # Ajustar según tu esquema
                'description': 'Análisis temporal de pedidos y ventas'
            },
            'general_info_query': {
                'embeddings': self.model.encode(general_patterns),
                'collection': 'DatabaseInvetary',
                'description': 'Información general y estadísticas básicas'
            },
            'detailed_analysis_query': {
                'embeddings': self.model.encode(detail_patterns),
                'collection': 'DatabaseInvetary',
                'description': 'Análisis detallado y específico'
            }
        }
        
        logger.info(f"📊 Sistema de intenciones inicializado con {len(self.intent_patterns)} categorías")
    
    def classify_intent(self, prompt: str) -> QueryIntent:
        """Clasifica la intención del usuario usando similitud semántica"""
        
        prompt_embedding = self.model.encode([prompt])
        best_intent = None
        best_confidence = 0
        
        # Comparar con todos los patrones
        for intent_type, intent_data in self.intent_patterns.items():
            similarities = cosine_similarity(prompt_embedding, intent_data['embeddings'])
            max_similarity = np.max(similarities)
            
            if max_similarity > best_confidence:
                best_confidence = max_similarity
                best_intent = intent_type
        
        # Extraer parámetros del prompt
        parameters = self._extract_smart_parameters(prompt, best_intent)
        
        return QueryIntent(
            intent_type=best_intent,
            confidence=float(best_confidence),
            parameters=parameters,
            collection=self.intent_patterns[best_intent]['collection'],
            description=self.intent_patterns[best_intent]['description']
        )
    
    def _extract_smart_parameters(self, prompt: str, intent_type: str) -> Dict[str, Any]:
        """Extrae parámetros inteligentemente del prompt"""
        
        params = {}
        prompt_lower = prompt.lower()
        
        # Extraer números para límites
        numbers = re.findall(r'\b(\d+)\b', prompt)
        if numbers:
            params['limit'] = min(int(numbers[0]), 20)  # Máximo 20 resultados
        else:
            params['limit'] = 5  # Default
        
        # Determinar dirección (ascendente/descendente)
        if any(word in prompt_lower for word in ['más', 'mayor', 'alto', 'top', 'mejores', 'máximo']):
            params['direction'] = 'desc'
            params['sort_description'] = 'mayor a menor'
        elif any(word in prompt_lower for word in ['menos', 'menor', 'bajo', 'mínimo', 'peores']):
            params['direction'] = 'asc' 
            params['sort_description'] = 'menor a mayor'
        else:
            params['direction'] = 'desc'
            params['sort_description'] = 'mayor a menor'
        
        # Extraer referencias temporales
        months_es = {
            'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
            'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
        }
        
        for month_name, month_num in months_es.items():
            if month_name in prompt_lower:
                params['month'] = month_num
                params['month_name'] = month_name.capitalize()
                params['year'] = datetime.now().year
                break
        
        # Detectar si quiere información detallada
        if any(word in prompt_lower for word in ['detallado', 'completo', 'específico', 'análisis']):
            params['detailed'] = True
        else:
            params['detailed'] = False
        
        return params

class SmartSchemaDiscovery:
    """Descubrimiento inteligente de esquemas de base de datos"""
    
    def __init__(self, mongo_uri: str):
        self.client = MongoClient(mongo_uri)
        self.schema_cache = {}
        self.db_name = os.getenv('MONGODB_DBNAME', 'test')
        logger.info(f"🔍 SchemaDiscovery conectado a: {self.db_name}")
    
    def discover_collection_schema(self, collection_name: str) -> Dict[str, Any]:
        """Descubre el esquema de una colección específica"""
        
        cache_key = f"{self.db_name}.{collection_name}"
        
        # Verificar cache
        if cache_key in self.schema_cache:
            return self.schema_cache[cache_key]
        
        try:
            db = self.client[self.db_name]
            collection = db[collection_name]
            
            # Verificar si la colección existe
            if collection_name not in db.list_collection_names():
                logger.warning(f"⚠️ Colección '{collection_name}' no encontrada")
                return self._get_fallback_schema(collection_name)
            
            # Obtener muestra representativa
            sample_size = min(50, collection.count_documents({}))
            sample_docs = list(collection.aggregate([
                {"$sample": {"size": sample_size}}
            ]))
            
            if not sample_docs:
                return {"error": "Colección vacía", "collection": collection_name}
            
            # Analizar estructura
            schema = self._analyze_documents(sample_docs, collection_name)
            schema['total_documents'] = collection.count_documents({})
            
            # Guardar en cache
            self.schema_cache[cache_key] = schema
            
            logger.info(f"📋 Schema descubierto para '{collection_name}': {len(schema['fields'])} campos")
            return schema
            
        except Exception as e:
            logger.error(f"❌ Error descubriendo schema para '{collection_name}': {e}")
            return self._get_fallback_schema(collection_name)
    
    def _analyze_documents(self, documents: List[Dict], collection_name: str) -> Dict[str, Any]:
        """Analiza documentos para construir esquema"""
        
        field_analysis = {}
        
        for doc in documents:
            for field, value in doc.items():
                if field not in field_analysis:
                    field_analysis[field] = {
                        'types': set(),
                        'sample_values': [],
                        'null_count': 0,
                        'total_count': 0
                    }
                
                field_analysis[field]['total_count'] += 1
                
                if value is None:
                    field_analysis[field]['null_count'] += 1
                else:
                    field_analysis[field]['types'].add(type(value).__name__)
                    if len(field_analysis[field]['sample_values']) < 3:
                        field_analysis[field]['sample_values'].append(value)
        
        # Construir esquema final
        schema = {
            'collection': collection_name,
            'fields': {},
            'sample_document': documents[0] if documents else {},
            'discovered_at': datetime.now().isoformat()
        }
        
        for field, analysis in field_analysis.items():
            schema['fields'][field] = {
                'types': list(analysis['types']),
                'primary_type': list(analysis['types'])[0] if analysis['types'] else 'unknown',
                'sample_values': analysis['sample_values'],
                'nullable': analysis['null_count'] > 0,
                'fill_rate': (analysis['total_count'] - analysis['null_count']) / analysis['total_count']
            }
        
        return schema
    
    def _get_fallback_schema(self, collection_name: str) -> Dict[str, Any]:
        """Esquema de respaldo cuando no se puede descubrir"""
        
        fallback_schemas = {
            'DatabaseInvetary': {
                'collection': 'DatabaseInvetary',
                'fields': {
                    'nombre': {'types': ['str'], 'primary_type': 'str'},
                    'stock': {'types': ['int'], 'primary_type': 'int'},
                    'precio': {'types': ['float'], 'primary_type': 'float'},
                    'categoria': {'types': ['str'], 'primary_type': 'str'}
                },
                'total_documents': 0,
                'fallback': True
            },
            'orders': {
                'collection': 'orders',
                'fields': {
                    'fecha': {'types': ['datetime'], 'primary_type': 'datetime'},
                    'total': {'types': ['float'], 'primary_type': 'float'},
                    'cliente': {'types': ['str'], 'primary_type': 'str'}
                },
                'total_documents': 0,
                'fallback': True
            }
        }
        
        return fallback_schemas.get(collection_name, {
            'collection': collection_name,
            'fields': {},
            'total_documents': 0,
            'error': 'Schema no disponible'
        })

class DynamicQueryGenerator:
    """Generador dinámico de consultas MongoDB"""
    
    def __init__(self, mongo_uri: str):
        self.client = MongoClient(mongo_uri)
        self.db_name = os.getenv('MONGODB_DBNAME', 'test')
        logger.info("⚙️ QueryGenerator inicializado")
    
    def generate_query(self, intent: QueryIntent, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Genera consulta MongoDB basada en intención y esquema"""
        
        if intent.intent_type == 'inventory_stock_query':
            return self._generate_inventory_query(intent, schema)
        elif intent.intent_type == 'temporal_analysis_query':
            return self._generate_temporal_query(intent, schema)
        elif intent.intent_type == 'general_info_query':
            return self._generate_general_query(intent, schema)
        elif intent.intent_type == 'detailed_analysis_query':
            return self._generate_detailed_query(intent, schema)
        else:
            return {"error": f"Tipo de consulta no soportado: {intent.intent_type}"}
    
    def _generate_inventory_query(self, intent: QueryIntent, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Genera consulta para inventario"""
        
        # Determinar campo de stock
        stock_field = self._find_field(schema, ['stock', 'cantidad', 'inventario', 'existencias'])
        name_field = self._find_field(schema, ['nombre', 'name', 'producto', 'descripcion'])
        price_field = self._find_field(schema, ['precio', 'price', 'valor', 'costo'])
        
        sort_order = -1 if intent.parameters['direction'] == 'desc' else 1
        
        return {
            'collection': intent.collection,
            'operation': 'find',
            'pipeline': [
                {"$match": {stock_field: {"$exists": True, "$ne": None}}},
                {"$sort": {stock_field: sort_order}},
                {"$limit": intent.parameters['limit']},
                {"$project": {
                    name_field: 1,
                    stock_field: 1,
                    price_field: 1,
                    "_id": 0
                }}
            ],
            'fields': {
                'stock': stock_field,
                'name': name_field,
                'price': price_field
            }
        }
    
    def _generate_temporal_query(self, intent: QueryIntent, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Genera consulta temporal"""
        
        date_field = self._find_field(schema, ['fecha', 'date', 'created_at', 'timestamp'])
        
        if 'month' in intent.parameters:
            # Consulta específica por mes
            start_date = datetime(intent.parameters['year'], intent.parameters['month'], 1)
            if intent.parameters['month'] == 12:
                end_date = datetime(intent.parameters['year'] + 1, 1, 1)
            else:
                end_date = datetime(intent.parameters['year'], intent.parameters['month'] + 1, 1)
            
            return {
                'collection': intent.collection,
                'operation': 'aggregate',
                'pipeline': [
                    {
                        "$match": {
                            date_field: {
                                "$gte": start_date,
                                "$lt": end_date
                            }
                        }
                    },
                    {
                        "$count": "total_pedidos"
                    }
                ],
                'query_type': 'monthly_specific',
                'month_name': intent.parameters['month_name']
            }
        else:
            # Consulta general por meses
            return {
                'collection': intent.collection,
                'operation': 'aggregate',
                'pipeline': [
                    {
                        "$match": {
                            date_field: {"$exists": True}
                        }
                    },
                    {
                        "$group": {
                            "_id": {
                                "mes": {"$month": f"${date_field}"},
                                "año": {"$year": f"${date_field}"}
                            },
                            "total_pedidos": {"$sum": 1}
                        }
                    },
                    {
                        "$sort": {"_id.año": -1, "_id.mes": -1}
                    },
                    {
                        "$limit": 12
                    }
                ],
                'query_type': 'monthly_summary'
            }
    
    def _generate_general_query(self, intent: QueryIntent, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Genera consulta general"""
        
        return {
            'collection': intent.collection,
            'operation': 'count_documents',
            'filter': {},
            'additional_stats': True
        }
    
    def _generate_detailed_query(self, intent: QueryIntent, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Genera consulta detallada"""
        
        return {
            'collection': intent.collection,
            'operation': 'aggregate',
            'pipeline': [
                {
                    "$group": {
                        "_id": "$categoria",
                        "total_productos": {"$sum": 1},
                        "stock_promedio": {"$avg": "$stock"},
                        "precio_promedio": {"$avg": "$precio"}
                    }
                },
                {
                    "$sort": {"total_productos": -1}
                }
            ],
            'query_type': 'category_analysis'
        }
    
    def _find_field(self, schema: Dict[str, Any], possible_names: List[str]) -> str:
        """Encuentra el campo correcto en el esquema"""
        
        if 'fields' not in schema:
            return possible_names[0]  # Fallback
        
        schema_fields = list(schema['fields'].keys())
        
        # Buscar coincidencia exacta
        for possible_name in possible_names:
            if possible_name in schema_fields:
                return possible_name
        
        # Buscar coincidencia parcial
        for field in schema_fields:
            for possible_name in possible_names:
                if possible_name.lower() in field.lower():
                    return field
        
        return possible_names[0]  # Fallback final
    
    def execute_query(self, query_dict: Dict[str, Any]) -> QueryResult:
        """Ejecuta la consulta generada"""
        
        start_time = datetime.now()
        
        try:
            db = self.client[self.db_name]
            collection = db[query_dict['collection']]
            
            if query_dict['operation'] == 'find':
                results = list(collection.aggregate(query_dict['pipeline']))
            
            elif query_dict['operation'] == 'aggregate':
                results = list(collection.aggregate(query_dict['pipeline']))
            
            elif query_dict['operation'] == 'count_documents':
                count = collection.count_documents(query_dict.get('filter', {}))
                results = [{'total': count}]
                
                # Agregar estadísticas adicionales si se solicita
                if query_dict.get('additional_stats', False):
                    sample = list(collection.find().limit(1))
                    if sample:
                        results[0]['has_data'] = True
                        results[0]['sample_fields'] = list(sample[0].keys())
                    else:
                        results[0]['has_data'] = False
            
            else:
                return QueryResult(
                    success=False,
                    data=[],
                    query_info=query_dict,
                    execution_time=0,
                    error_message=f"Operación no soportada: {query_dict['operation']}"
                )
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return QueryResult(
                success=True,
                data=results,
                query_info=query_dict,
                execution_time=execution_time
            )
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            logger.error(f"❌ Error ejecutando consulta: {e}")
            
            return QueryResult(
                success=False,
                data=[],
                query_info=query_dict,
                execution_time=execution_time,
                error_message=str(e)
            )

class IntelligentResponseGenerator:
    """Generador de respuestas naturales e inteligentes"""
    
    def __init__(self):
        self.month_names = [
            '', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ]
        logger.info("💬 ResponseGenerator inicializado")
    
    def generate_response(self, query_result: QueryResult, intent: QueryIntent, original_prompt: str) -> str:
        """Genera respuesta natural basada en los resultados"""
        
        if not query_result.success:
            return f"❌ Lo siento, hubo un problema ejecutando tu consulta: {query_result.error_message}"
        
        if not query_result.data:
            return "📭 No encontré información para tu consulta. Verifica que la base de datos tenga datos."
        
        # Routing por tipo de intención
        if intent.intent_type == 'inventory_stock_query':
            return self._format_inventory_response(query_result, intent)
        elif intent.intent_type == 'temporal_analysis_query':
            return self._format_temporal_response(query_result, intent)
        elif intent.intent_type == 'general_info_query':
            return self._format_general_response(query_result, intent)
        elif intent.intent_type == 'detailed_analysis_query':
            return self._format_detailed_response(query_result, intent)
        else:
            return self._format_generic_response(query_result, intent)
    
    def _format_inventory_response(self, result: QueryResult, intent: QueryIntent) -> str:
        """Formatea respuesta de inventario"""
        
        params = intent.parameters
        direction_text = "mayor" if params['direction'] == 'desc' else "menor"
        limit = params['limit']
        
        response = f"📦 **Productos con {direction_text} stock** (Top {limit}):\n\n"
        
        # Obtener campos del query
        fields = result.query_info.get('fields', {})
        stock_field = fields.get('stock', 'stock')
        name_field = fields.get('name', 'nombre')
        price_field = fields.get('price', 'precio')
        
        for i, product in enumerate(result.data, 1):
            name = product.get(name_field, product.get('nombre', 'Producto sin nombre'))
            stock = product.get(stock_field, product.get('stock', 0))
            price = product.get(price_field, product.get('precio', 0))
            
            # Formatear precio
            if isinstance(price, (int, float)) and price > 0:
                price_text = f"${price:,.2f}"
            else:
                price_text = "Sin precio"
            
            # Emoji basado en stock
            if stock > 50:
                emoji = "🟢"
            elif stock > 10:
                emoji = "🟡"
            else:
                emoji = "🔴"
            
            response += f"{i}. {emoji} **{name}**\n"
            response += f"   📊 Stock: **{stock}** unidades\n"
            response += f"   💰 Precio: {price_text}\n\n"
        
        # Agregar información adicional
        response += f"⏱️ *Consulta ejecutada en {result.execution_time:.2f} segundos*\n"
        response += f"🎯 *Ordenado por stock ({params['sort_description']})*"
        
        return response
    
    def _format_temporal_response(self, result: QueryResult, intent: QueryIntent) -> str:
        """Formatea respuesta temporal"""
        
        query_type = result.query_info.get('query_type', 'unknown')
        
        if query_type == 'monthly_specific':
            # Respuesta específica por mes
            if result.data and 'total_pedidos' in result.data[0]:
                total = result.data[0]['total_pedidos']
                month_name = result.query_info.get('month_name', 'el mes consultado')
                
                # Contexto adicional
                if total == 0:
                    context = "No se registró actividad ese mes."
                elif total < 10:
                    context = "Fue un mes de baja actividad."
                elif total < 50:
                    context = "Actividad moderada."
                else:
                    context = "¡Excelente actividad ese mes!"
                
                response = f"📅 **Pedidos en {month_name}**: **{total}** pedidos\n\n"
                response += f"💡 *{context}*\n"
                response += f"⏱️ *Consulta ejecutada en {result.execution_time:.2f} segundos*"
                
                return response
            else:
                return f"📅 No encontré pedidos para {result.query_info.get('month_name', 'ese mes')}."
        
        elif query_type == 'monthly_summary':
            # Resumen por meses
            response = "📊 **Resumen de pedidos por mes**:\n\n"
            
            total_general = 0
            for i, result_data in enumerate(result.data[:6], 1):
                month = result_data['_id']['mes']
                year = result_data['_id']['año']
                total = result_data['total_pedidos']
                total_general += total
                
                month_name = self.month_names[month]
                
                # Emoji basado en cantidad
                if total > 50:
                    emoji = "🚀"
                elif total > 20:
                    emoji = "📈"
                elif total > 0:
                    emoji = "📊"
                else:
                    emoji = "📉"
                
                response += f"{i}. {emoji} **{month_name} {year}**: {total} pedidos\n"
            
            response += f"\n💼 **Total últimos meses**: {total_general} pedidos\n"
            response += f"📈 **Promedio mensual**: {total_general/len(result.data):.1f} pedidos\n"
            response += f"⏱️ *Consulta ejecutada en {result.execution_time:.2f} segundos*"
            
            return response
        
        return "📅 Análisis temporal completado."
    
    def _format_general_response(self, result: QueryResult, intent: QueryIntent) -> str:
        """Formatea respuesta general"""
        
        if result.data and 'total' in result.data[0]:
            total = result.data[0]['total']
            
            # Contexto basado en cantidad
            if total == 0:
                context = "La base de datos está vacía."
                emoji = "📭"
            elif total < 100:
                context = "Inventario pequeño."
                emoji = "📦"
            elif total < 1000:
                context = "Inventario moderado."
                emoji = "📊"
            elif total < 10000:
                context = "Inventario grande."
                emoji = "🏪"
            else:
                context = "¡Inventario masivo!"
                emoji = "🏭"
            
            response = f"{emoji} **Total de productos**: **{total:,}**\n\n"
            response += f"💡 *{context}*\n"
            
            # Información adicional si está disponible
            if result.data[0].get('has_data', False):
                fields = result.data[0].get('sample_fields', [])
                response += f"🔍 *Campos disponibles*: {', '.join(fields[:5])}{'...' if len(fields) > 5 else ''}\n"
            
            response += f"⏱️ *Consulta ejecutada en {result.execution_time:.2f} segundos*"
            
            return response
        
        return "📊 Información general disponible."
    
    def _format_detailed_response(self, result: QueryResult, intent: QueryIntent) -> str:
        """Formatea respuesta detallada"""
        
        response = "🔍 **Análisis detallado por categorías**:\n\n"
        
        for i, category in enumerate(result.data[:10], 1):
            cat_name = category.get('_id', 'Sin categoría')
            total_productos = category.get('total_productos', 0)
            stock_promedio = category.get('stock_promedio', 0)
            precio_promedio = category.get('precio_promedio', 0)
            
            response += f"{i}. **{cat_name}**\n"
            response += f"   📦 Productos: {total_productos}\n"
            response += f"   📊 Stock promedio: {stock_promedio:.1f}\n"
            response += f"   💰 Precio promedio: ${precio_promedio:.2f}\n\n"
        
        response += f"⏱️ *Consulta ejecutada en {result.execution_time:.2f} segundos*"
        return response
    
    def _format_generic_response(self, result: QueryResult, intent: QueryIntent) -> str:
        """Respuesta genérica para casos no específicos"""
        
        data_count = len(result.data)
        response = f"🔍 **Consulta completada**\n\n"
        response += f"📊 Encontré **{data_count}** resultado{'s' if data_count != 1 else ''}\n"
        response += f"🎯 Tipo de consulta: *{intent.description}*\n"
        response += f"⚱️ Confianza: {intent.confidence:.1%}\n"
        response += f"⏱️ Tiempo de ejecución: {result.execution_time:.2f}s"
        
        return response

# ==========================================
# AGENTE PRINCIPAL UNIFICADO
# ==========================================

class DynamicIntelligenceAgent:
    """
    🧠 Agente de Inteligencia Dinámico
    Sistema que funciona como Claude/GPT pero especializado en tus bases de datos
    """
    
    def __init__(self, mongo_uri: str = None, db_name: str = None):
        """Inicializa el agente con configuración automática"""
        
        # Configuración de conexión
        self.mongo_uri = mongo_uri or os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.db_name = db_name or os.getenv('MONGODB_DBNAME', 'test')
        
        # Configurar logging
        self._setup_logging()
        
        logger.info("🚀 Inicializando DynamicIntelligenceAgent...")
        
        try:
            # Inicializar componentes
            self.embedding_engine = IntelligentEmbeddingEngine()
            self.schema_discovery = SmartSchemaDiscovery(self.mongo_uri)
            self.query_generator = DynamicQueryGenerator(self.mongo_uri)
            self.response_generator = IntelligentResponseGenerator()
            
            # Verificar conexión a MongoDB
            self._verify_connection()
            
            logger.success("✅ DynamicIntelligenceAgent inicializado correctamente")
            
        except Exception as e:
            logger.error(f"❌ Error inicializando agente: {e}")
            raise
    
    def _setup_logging(self):
        """Configura el sistema de logging"""
        
        # Crear directorio de logs si no existe
        Path("logs").mkdir(exist_ok=True)
        
        # Configurar formato de logs
        log_format = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
        logger.add("logs/agent.log", format=log_format, level="INFO", rotation="10 MB")
    
    def _verify_connection(self):
        """Verifica la conexión a MongoDB"""
        
        try:
            client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            client.server_info()  # Fuerza una conexión
            
            # Listar bases de datos disponibles
            db_names = client.list_database_names()
            logger.info(f"🔗 Conectado a MongoDB. Bases disponibles: {db_names}")
            
            # Verificar si la base de datos objetivo existe
            if self.db_name in db_names:
                db = client[self.db_name]
                collections = db.list_collection_names()
                logger.info(f"📚 Base de datos '{self.db_name}' encontrada. Colecciones: {collections}")
            else:
                logger.warning(f"⚠️ Base de datos '{self.db_name}' no encontrada. Se creará automáticamente.")
            
            client.close()
            
        except Exception as e:
            logger.error(f"❌ Error conectando a MongoDB: {e}")
            raise ConnectionError(f"No se pudo conectar a MongoDB: {e}")
    
    def process_query(self, prompt: str, debug: bool = False) -> str:
        """
        Procesa una consulta completa del usuario
        
        Args:
            prompt (str): La consulta del usuario
            debug (bool): Si mostrar información de debug
            
        Returns:
            str: Respuesta natural generada
        """
        
        start_time = datetime.now()
        
        try:
            logger.info(f"🔍 Procesando consulta: '{prompt}'")
            
            # 1. Clasificar intención usando embeddings
            intent = self.embedding_engine.classify_intent(prompt)
            logger.info(f"🎯 Intención detectada: {intent.intent_type} (confianza: {intent.confidence:.2%})")
            
            if debug:
                print(f"DEBUG - Intención: {intent}")
            
            # Verificar confianza mínima
            min_confidence = float(os.getenv('CONFIDENCE_THRESHOLD', 0.3))
            if intent.confidence < min_confidence:
                logger.warning(f"⚠️ Confianza baja ({intent.confidence:.2%}). Usando respuesta genérica.")
                return self._generate_low_confidence_response(prompt, intent)
            
            # 2. Descubrir esquema relevante
            schema = self.schema_discovery.discover_collection_schema(intent.collection)
            logger.info(f"📋 Schema obtenido para colección: {intent.collection}")
            
            if debug:
                print(f"DEBUG - Schema: {schema}")
            
            # 3. Generar consulta dinámica
            query = self.query_generator.generate_query(intent, schema)
            logger.info(f"⚙️ Consulta generada: {query.get('operation', 'unknown')}")
            
            if debug:
                print(f"DEBUG - Query: {query}")
            
            # Verificar si hay error en la generación de consulta
            if 'error' in query:
                logger.error(f"❌ Error generando consulta: {query['error']}")
                return f"❌ No pude procesar tu consulta: {query['error']}"
            
            # 4. Ejecutar consulta
            result = self.query_generator.execute_query(query)
            logger.info(f"🔄 Consulta ejecutada. Éxito: {result.success}, Resultados: {len(result.data)}")
            
            if debug:
                print(f"DEBUG - Result: {result}")
            
            # 5. Generar respuesta natural
            response = self.response_generator.generate_response(result, intent, prompt)
            
            # Agregar información de debug si se solicita
            if debug:
                execution_time = (datetime.now() - start_time).total_seconds()
                response += f"\n\n🔧 **DEBUG INFO**\n"
                response += f"- Tiempo total: {execution_time:.2f}s\n"
                response += f"- Confianza: {intent.confidence:.2%}\n"
                response += f"- Colección: {intent.collection}\n"
                response += f"- Tipo consulta: {intent.intent_type}"
            
            logger.success(f"✅ Consulta procesada exitosamente en {(datetime.now() - start_time).total_seconds():.2f}s")
            return response
            
        except Exception as e:
            logger.error(f"❌ Error procesando consulta: {e}")
            return f"❌ Lo siento, hubo un error interno procesando tu consulta: {str(e)}"
    
    def _generate_low_confidence_response(self, prompt: str, intent: QueryIntent) -> str:
        """Genera respuesta cuando la confianza es baja"""
        
        suggestions = [
            "Dame los productos con más stock",
            "¿Cuántos pedidos se hicieron en junio?",
            "Total de productos en inventario",
            "Lista los 5 productos con menos stock"
        ]
        
        response = f"🤔 No estoy seguro de cómo interpretar tu consulta.\n\n"
        response += f"📊 Mi mejor interpretación fue: *{intent.description}* (confianza: {intent.confidence:.1%})\n\n"
        response += f"💡 **Prueba con consultas como:**\n"
        
        for suggestion in suggestions:
            response += f"   • {suggestion}\n"
        
        return response
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas del sistema"""
        
        try:
            client = MongoClient(self.mongo_uri)
            db = client[self.db_name]
            
            stats = {
                'database': self.db_name,
                'collections': {},
                'total_documents': 0,
                'system_status': 'healthy'
            }
            
            for collection_name in db.list_collection_names():
                collection = db[collection_name]
                doc_count = collection.count_documents({})
                stats['collections'][collection_name] = doc_count
                stats['total_documents'] += doc_count
            
            client.close()
            
            # Estadísticas de intenciones
            stats['supported_intents'] = list(self.embedding_engine.intent_patterns.keys())
            stats['cache_size'] = len(self.schema_discovery.schema_cache)
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo estadísticas: {e}")
            return {'error': str(e), 'system_status': 'error'}
    
    def test_system(self) -> str:
        """Ejecuta pruebas básicas del sistema"""
        
        test_queries = [
            "Dame los 3 productos con más stock",
            "¿Cuántos pedidos se hicieron en junio?",
            "Total de productos en inventario"
        ]
        
        results = []
        results.append("🧪 **PRUEBAS DEL SISTEMA**\n" + "="*50)
        
        for i, query in enumerate(test_queries, 1):
            results.append(f"\n**Prueba {i}:** {query}")
            results.append("-" * 30)
            
            try:
                response = self.process_query(query)
                status = "✅ ÉXITO"
            except Exception as e:
                response = f"❌ Error: {e}"
                status = "❌ FALLO"
            
            results.append(f"**Estado:** {status}")
            results.append(f"**Respuesta:** {response}")
        
        # Estadísticas del sistema
        results.append(f"\n\n📊 **ESTADÍSTICAS DEL SISTEMA**")
        results.append("-" * 30)
        
        stats = self.get_system_stats()
        if 'error' not in stats:
            results.append(f"🗄️ Base de datos: {stats['database']}")
            results.append(f"📚 Colecciones: {len(stats['collections'])}")
            results.append(f"📄 Total documentos: {stats['total_documents']:,}")
            results.append(f"🧠 Intenciones soportadas: {len(stats['supported_intents'])}")
        else:
            results.append(f"❌ Error obteniendo estadísticas: {stats['error']}")
        
        return "\n".join(results)

# ==========================================
# INTERFAZ INTERACTIVA
# ==========================================

class InteractiveAgent:
    """Interfaz interactiva para el agente"""
    
    def __init__(self):
        self.agent = DynamicIntelligenceAgent()
        self.session_history = []
    
    def start_interactive_session(self):
        """Inicia una sesión interactiva"""
        
        print("🧠 SISTEMA IA DINÁMICO - SESIÓN INTERACTIVA")
        print("=" * 60)
        print("💡 Escribe 'help' para ver comandos disponibles")
        print("💡 Escribe 'quit' para salir")
        print("=" * 60)
        
        while True:
            try:
                # Obtener input del usuario
                prompt = input("\n🔍 Tu consulta: ").strip()
                
                if not prompt:
                    continue
                
                # Comandos especiales
                if prompt.lower() == 'quit':
                    print("👋 ¡Hasta pronto!")
                    break
                elif prompt.lower() == 'help':
                    self._show_help()
                    continue
                elif prompt.lower() == 'stats':
                    print("\n" + self._format_stats())
                    continue
                elif prompt.lower() == 'test':
                    print("\n" + self.agent.test_system())
                    continue
                elif prompt.lower() == 'clear':
                    self.session_history.clear()
                    print("🗑️ Historial limpiado")
                    continue
                
                # Procesar consulta normal
                print("\n🤖 Procesando...")
                response = self.agent.process_query(prompt)
                print(f"\n{response}")
                
                # Guardar en historial
                self.session_history.append({
                    'prompt': prompt,
                    'response': response,
                    'timestamp': datetime.now().isoformat()
                })
                
            except KeyboardInterrupt:
                print("\n\n👋 Sesión interrumpida. ¡Hasta pronto!")
                break
            except Exception as e:
                print(f"\n❌ Error: {e}")
    
    def _show_help(self):
        """Muestra ayuda de comandos"""
        
        help_text = """
🆘 **COMANDOS DISPONIBLES:**

**Consultas de ejemplo:**
  • "Dame los 5 productos con más stock"
  • "¿Cuántos pedidos se hicieron en junio?"
  • "Total de productos en inventario"
  • "Productos con menos stock"

**Comandos especiales:**
  • help  - Muestra esta ayuda
  • stats - Estadísticas del sistema
  • test  - Ejecuta pruebas del sistema
  • clear - Limpia el historial
  • quit  - Salir del programa

**Consejos:**
  • Puedes especificar números: "3 productos con más stock"
  • Puedes mencionar meses: "pedidos en julio"
  • El sistema entiende sinónimos y variaciones
        """
        print(help_text)
    
    def _format_stats(self):
        """Formatea estadísticas del sistema"""
        
        stats = self.agent.get_system_stats()
        
        if 'error' in stats:
            return f"❌ Error obteniendo estadísticas: {stats['error']}"
        
        formatted = "📊 **ESTADÍSTICAS DEL SISTEMA**\n"
        formatted += f"🗄️ Base de datos: {stats['database']}\n"
        formatted += f"📚 Colecciones disponibles:\n"
        
        for collection, count in stats['collections'].items():
            formatted += f"   • {collection}: {count:,} documentos\n"
        
        formatted += f"📄 Total documentos: {stats['total_documents']:,}\n"
        formatted += f"🧠 Intenciones soportadas: {len(stats['supported_intents'])}\n"
        formatted += f"💾 Esquemas en cache: {stats['cache_size']}\n"
        formatted += f"📈 Consultas en sesión: {len(self.session_history)}"
        
        return formatted

# ==========================================
# FUNCIÓN PRINCIPAL Y TESTING
# ==========================================

def main():
    """Función principal del sistema"""
    
    print("🧠 SISTEMA IA DINÁMICO MULTI-DATABASE")
    print("=====================================")
    
    try:
        # Verificar variables de entorno
        mongo_uri = os.getenv('MONGODB_URI')
        db_name = os.getenv('MONGODB_DBNAME')
        
        if not mongo_uri:
            print("⚠️ Variable MONGODB_URI no encontrada en .env")
            mongo_uri = input("💡 Ingresa tu URI de MongoDB: ").strip()
        
        if not db_name:
            print("⚠️ Variable MONGODB_DB_NAME no encontrada en .env")
            db_name = input("💡 Ingresa el nombre de tu base de datos: ").strip()
        
        # Inicializar agente
        agent = DynamicIntelligenceAgent(mongo_uri, db_name)
        
        # Mostrar menú
        while True:
            print("\n🎯 **OPCIONES DISPONIBLES:**")
            print("1. 🔄 Sesión interactiva")
            print("2. 🧪 Ejecutar pruebas")
            print("3. 📊 Ver estadísticas")
            print("4. 🚪 Salir")
            
            choice = input("\n👉 Selecciona una opción (1-4): ").strip()
            
            if choice == '1':
                interactive = InteractiveAgent()
                interactive.start_interactive_session()
            
            elif choice == '2':
                print("\n" + agent.test_system())
            
            elif choice == '3':
                stats = agent.get_system_stats()
                if 'error' not in stats:
                    print(f"\n📊 Base de datos: {stats['database']}")
                    print(f"📚 Colecciones: {len(stats['collections'])}")
                    print(f"📄 Total documentos: {stats['total_documents']:,}")
                    for collection, count in stats['collections'].items():
                        print(f"   • {collection}: {count:,}")
                else:
                    print(f"\n❌ Error: {stats['error']}")
            
            elif choice == '4':
                print("\n👋 ¡Hasta pronto!")
                break
            
            else:
                print("\n❌ Opción inválida. Intenta de nuevo.")
    
    except Exception as e:
        logger.error(f"❌ Error en función principal: {e}")
        print(f"\n❌ Error crítico: {e}")

if __name__ == "__main__":
    main()