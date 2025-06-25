from fastapi import APIRouter
from app.community.community_member.models import Member, MemberCreate, MemberListResponse, MemberUpdate, MemberResponse
from app.database.mongo import community_collection, member_collection
from fastapi import HTTPException, status, BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv

router = APIRouter()

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("CORREO_REMITENTE"),
    MAIL_PASSWORD=os.getenv("CONTRASENA_APLICACION"),
    MAIL_FROM=os.getenv("CORREO_REMITENTE"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_welcome_email(email: str, full_name: str, city: str, country: str):
    # URL de la imagen de encabezado
    header_image_url = "https://imgbrain.s3.us-east-1.amazonaws.com/communities/39afabdc-dcc9-40d9-9898-3a5b71f6a0fc.jpg"
    
    # Cuerpo del mensaje en HTML con todos los textos en color negro
    email_body = f"""
    <html>
    <head>
        <style>
            body {{ 
                font-family: 'Arial', sans-serif; 
                line-height: 1.6; 
                color: #000000; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px;
            }}
            .header-image {{
                width: 100%;
                max-height: 200px;
                object-fit: cover;
                margin-bottom: 20px;
            }}
            .greeting {{
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
                color: #000000;
            }}
            .content {{
                margin-bottom: 30px;
                color: #000000;
            }}
            .signature {{
                margin-top: 30px;
                border-top: 1px solid #eaeaea;
                padding-top: 20px;
                color: #000000;
            }}
            .signature-name {{
                font-weight: bold;
                color: #000000;
            }}
            .footer {{
                margin-top: 40px;
                font-size: 12px;
                color: #000000;
                text-align: center;
            }}
            strong {{
                color: #000000;
            }}
        </style>
    </head>
    <body>
        <!-- Encabezado con imagen -->
        <img src="{header_image_url}" alt="Rizos Professional" class="header-image">
        
        <div class="greeting">Bienvenida al programa Rizos Professional</div>
        
        <div class="content">
            <p>Estimado/a <strong>{full_name}</strong>,</p>
            
            <p>Te damos la bienvenida al programa Rizos Professional.</p>
            
            <p>A partir de hoy haces parte de una red de profesionales que comparten el compromiso con la excelencia técnica 
            y el respeto profundo por el cabello rizado, ondulado y afro. Este programa ha sido diseñado para fortalecer 
            tus capacidades, actualizar tus conocimientos y brindarte herramientas concretas para el desarrollo de tu 
            práctica profesional.</p>
            
            <p>Desde Rizos Felices, creemos que formar especialistas en rizos no solo eleva el estándar de la industria, 
            sino que transforma la manera en que las personas viven su identidad.</p>
            
            <p>Mi nombre es <strong>Delcy Giraldo</strong>, directora creativa de la marca, y junto con <strong>Natalia Arredondo</strong>, directora general, 
            te agradecemos por confiar en este proceso. Estás en el lugar indicado para crecer profesionalmente y proyectarte 
            con respaldo, metodología y visión de futuro.</p>
            
            <p>En breve recibirás la información logística de inicio, acceso a los contenidos, y las instrucciones para el 
            desarrollo del programa.</p>
            
            <p>Bienvenido/a.</p>
        </div>
        
        <div class="signature">
            <p>Atentamente,</p>
            <p class="signature-name">Delcy Giraldo</p>
            <p>Directora Creativa<br>Rizos Felices</p>
            
            <p class="signature-name">Natalia Arredondo</p>
            <p>Directora General<br>Rizos Felices</p>
        </div>
        
        <div class="footer">
            <p>© {datetime.now().year} Rizos Felices. Todos los derechos reservados.</p>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="Bienvenida al programa Rizos Professional",
        recipients=[email],
        body=email_body,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)
    
@router.post("/CreateMember",
    response_model=MemberResponse,
    status_code=status.HTTP_201_CREATED,
    description="Crea un nuevo miembro en una comunidad y envía correo de bienvenida"
)
async def create_member(
    member_data: MemberCreate,
    background_tasks: BackgroundTasks
):
    # Verificar si el email ya existe en la comunidad   
    existing_member = await member_collection.find_one({
        "community_id": member_data.community_id,
        "email": member_data.email
    })
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado en esta comunidad"
        )

    # Crear el objeto Member con valores por defecto
    new_member = Member(
        **member_data.dict(),
        user_id=str(ObjectId()),
        registration_date=datetime.now().strftime("%d/%m/%Y")
    )

    try:
        # Insertar en la base de datos
        result = await member_collection.insert_one(new_member.dict())
        created_member = await member_collection.find_one({"_id": result.inserted_id})
        
        # Enviar correo en segundo plano
        background_tasks.add_task(
            send_welcome_email,
            email=member_data.email,
            full_name=member_data.full_name,
            city=member_data.city,
            country=member_data.country
        )
        
        return MemberResponse(**created_member)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear miembro: {str(e)}"
        )

@router.get("/members/by-url/{community_url}",
    response_model=MemberListResponse,
    description="Obtener todos los miembros de una comunidad específica usando su URL",
    responses={
        404: {"description": "Comunidad no encontrada"}
    }
)
async def get_all_members_by_community_url(community_url: str):
    # Verificar si la comunidad existe por su URL
    community = await community_collection.find_one({"url": community_url})
    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comunidad no encontrada"
        )
    
    # Obtener todos los miembros de la comunidad usando el community_id encontrado
    members_cursor = member_collection.find({"community_id": str(community["id"])})
    members = await members_cursor.to_list(length=None)
    
    # Contar miembros
    count = await member_collection.count_documents({"community_id": str(community["id"])})
    
    return {
        "members": members,
        "count": count
    }

@router.patch("/UpdateMember", response_model=dict)
async def update_member(user_id: str, update_data: MemberUpdate):
    """
    Actualiza un miembro existente usando su user_id.
    
    Campos actualizables:
    - full_name (ignora si es "string")
    - email (ignora si es "string" o vacío)
    - phone (ignora si es "string")
    - join_reason (ignora si es "string")
    - status (ignora si es "string")
    """
    # 1. Buscar el miembro por user_id
    existing_member = await member_collection.find_one({"user_id": user_id})
    
    if not existing_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró miembro con user_id: {user_id}"
        )
    
    # 2. Preparar campos a actualizar (excluyendo valores no válidos)
    update_fields = {}
    for field, value in update_data.dict(exclude_unset=True).items():
        if value is not None and value != "string" and value != "":
            update_fields[field] = value
    
    # Si no hay campos válidos para actualizar
    if not update_fields:
        return {"message": "No se realizaron cambios - Campos no válidos"}
    
    # 3. Validar email único si se está actualizando
    if "email" in update_fields:
        if update_fields["email"] != existing_member["email"]:
            email_exists = await member_collection.find_one({
                "community_id": existing_member["community_id"],
                "email": update_fields["email"],
                "user_id": {"$ne": user_id}
            })
            if email_exists:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El email ya está registrado en esta comunidad"
                )
    
    # 4. Actualizar en la base de datos
    try:
        result = await member_collection.update_one(
            {"user_id": user_id},
            {"$set": update_fields}
        )
        
        if result.modified_count == 0:
            return {"message": "No se realizaron cambios"}
            
        return {
            "message": "Miembro actualizado correctamente",
            "updated_fields": list(update_fields.keys())
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar miembro: {str(e)}"
        )
        
@router.delete("/DeleteMember",response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Eliminar un miembro por su user_id",
    responses={
        404: {"description": "Miembro no encontrado"},
        200: {"description": "Miembro eliminado correctamente"}
    }
)
async def delete_member(user_id: str):
    """
    Elimina un miembro de la comunidad usando su user_id.
    
    - Actualiza el contador de miembros en la comunidad automáticamente
    - Elimina permanentemente el registro del miembro
    """
    
    # 1. Buscar y eliminar el miembro por user_id
    member = await member_collection.find_one_and_delete({"user_id": user_id})
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró miembro con user_id: {user_id}"
        )
    
    # 2. Actualizar contador en la comunidad (opcional)
    try:
        await community_collection.update_one(
            {"id": member["community_id"]},
            {"$inc": {"members": -1}}
        )
    except:
        pass  # Si falla no interrumpimos la operación
    
    return {
        "message": "Miembro eliminado correctamente",
        "deleted_user_id": user_id,
        "community_id": member["community_id"]
    }
