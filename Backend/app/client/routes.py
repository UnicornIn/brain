from fastapi import APIRouter, HTTPException, Query
from app.client.controllers import get_all_contacts
from fastapi.responses import JSONResponse, StreamingResponse
from io import StringIO
import csv
from dateutil import parser
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(
    prefix="/subscribers/contacts",  # Cambiado para coincidir con tu URL
)

@router.get("/all")
async def get_all_contacts_endpoint():
    """
    Obtiene TODOS los contactos de la colección con TODOS sus campos
    
    Devuelve:
    - Array completo con todos los documentos de la colección
    - Cada documento con todos sus campos originales
    - Incluyendo _id, custom_fields y todos los metadatos
    
    Ejemplo de respuesta exitosa:
    {
        "status": "success",
        "count": 2,
        "data": [
            {
                "_id": "680675f555b45d586709069a",
                "subscriber_id": "550714087",
                ...
            },
            ...
        ]
    }
    """
    try:
        contacts = await get_all_contacts()
        
        return JSONResponse({
            "status": "success",
            "count": len(contacts),
            "data": contacts
        })
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error inesperado: {str(e)}"
        )
        
@router.get("/filtered")
async def filter_and_export_contacts(
    status: Optional[str] = Query(None, example="active", description="Estado del suscriptor"),
    source_system: Optional[str] = Query(None, example="instagram", description="Plataforma de origen"),
    date_from: Optional[str] = Query(None, example="2025-04-01", description="Fecha desde (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, example="2025-04-30", description="Fecha hasta (YYYY-MM-DD)"),
    export_as: Optional[str] = Query(None, enum=["csv", "json"], description="Formato de exportación")
):
    """
    🔍 Filtra y exporta suscriptores con manejo correcto de zonas horarias
    """
    try:
        # 1. Obtener todos los contactos
        all_contacts = await get_all_contacts()
        print(f"Total contacts retrieved: {len(all_contacts)}")
        
        # 2. Preparar filtros de fecha
        date_filters = {}
        if date_from:
            date_filters["$gte"] = datetime.strptime(date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        if date_to:
            # Incluir todo el día final
            date_filters["$lte"] = datetime.strptime(date_to, "%Y-%m-%d").replace(
                tzinfo=timezone.utc,
                hour=23,
                minute=59,
                second=59
            )

        # 3. Aplicar filtros
        filtered_contacts = []
        for contact in all_contacts:
            # Debug: Mostrar ID del contacto
            contact_id = contact.get("subscriber_id", "N/A")
            print(f"\nEvaluating contact: {contact_id}")
            
            # Filtro por status
            if status and contact.get("status") != status:
                print(f"Skipping due to status filter: {contact.get('status')}")
                continue
                
            # Filtro por source_system
            if source_system and contact.get("source_system") != source_system:
                print(f"Skipping due to source_system filter: {contact.get('source_system')}")
                continue
                
            # Filtro por fechas (solo si hay filtros de fecha)
            if date_filters:
                subscribed = contact.get("subscribed")
                if not subscribed:
                    print("Skipping: No subscribed date")
                    continue
                    
                try:
                    # Parsear fecha con manejo de timezone
                    if isinstance(subscribed, str):
                        sub_date = parser.isoparse(subscribed)
                    else:
                        sub_date = subscribed
                    
                    # Asegurar que la fecha tenga timezone (asumir UTC si no tiene)
                    if sub_date.tzinfo is None:
                        sub_date = sub_date.replace(tzinfo=timezone.utc)
                        print(f"Assigned UTC to naive datetime: {sub_date}")
                    
                    # Aplicar filtros
                    if "$gte" in date_filters and sub_date < date_filters["$gte"]:
                        print(f"Skipping: Date {sub_date} before {date_filters['$gte']}")
                        continue
                        
                    if "$lte" in date_filters and sub_date > date_filters["$lte"]:
                        print(f"Skipping: Date {sub_date} after {date_filters['$lte']}")
                        continue
                        
                    print(f"Date within range: {sub_date}")
                    
                except Exception as e:
                    print(f"Error parsing date {subscribed}: {str(e)}")
                    continue
            
            # Si pasa todos los filtros
            filtered_contacts.append(contact)
            print("Contact passed all filters")

        print(f"\nTotal filtered contacts: {len(filtered_contacts)}")
        
        # 4. Preparar respuesta según formato
        if export_as == "csv":
            def generate_csv():
                if not filtered_contacts:
                    yield "No se encontraron contactos con los filtros aplicados\n"
                    return

                # Campos a incluir en el CSV
                fieldnames = [
                    "subscriber_id", "first_name", "last_name", "email", "phone",
                    "ig_username", "tt_username", "source_system", "status",
                    "subscribed", "ig_last_interaction", "live_chat_url"
                ]
                
                output = StringIO()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                
                # Escribir encabezados
                writer.writeheader()
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)
                
                # Escribir datos
                for contact in filtered_contacts:
                    row = {field: contact.get(field, "") for field in fieldnames}
                    # Convertir fechas a string
                    for date_field in ["subscribed", "ig_last_interaction"]:
                        if date_field in row and row[date_field]:
                            if isinstance(row[date_field], (datetime, str)):
                                try:
                                    if isinstance(row[date_field], str):
                                        dt = parser.isoparse(row[date_field])
                                    else:
                                        dt = row[date_field]
                                    row[date_field] = dt.isoformat()
                                except:
                                    row[date_field] = str(row[date_field])
                    writer.writerow(row)
                    yield output.getvalue()
                    output.seek(0)
                    output.truncate(0)

            return StreamingResponse(
                generate_csv(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=contactos_filtrados.csv"}
            )
        
        # Respuesta JSON
        return JSONResponse({
            "status": "success",
            "count": len(filtered_contacts),
            "filters_applied": {
                "status": status,
                "source_system": source_system,
                "date_from": date_from,
                "date_to": date_to
            },
            "data": filtered_contacts
        })

    except Exception as e:
        print(f"Critical error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la solicitud: {str(e)}"
        )