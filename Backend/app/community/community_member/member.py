from fastapi import APIRouter
from fastapi import HTTPException, status
from app.community.community_member.models import Member, MemberCreate, MemberListResponse, MemberUpdate
from app.database.mongo import community_collection, member_collection

router = APIRouter()

@router.post("/CreateMember",
    response_model=Member,
    status_code=status.HTTP_201_CREATED,
    description="Crear un nuevo miembro en una comunidad"
)
async def create_member(member_data: MemberCreate):
    # Buscar comunidad por UUID (id) no por _id
    community = await community_collection.find_one({"id": member_data.community_id})
    
    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comunidad no encontrada"
        )
    
    # Verificar si el email ya está registrado
    existing_member = await member_collection.find_one({
        "community_id": member_data.community_id,
        "email": member_data.email
    })
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado en esta comunidad"
        )
    
    # Crear el nuevo miembro
    new_member = Member(
        community_id=member_data.community_id,
        full_name=member_data.full_name,
        email=member_data.email,
        phone=member_data.phone,
        join_reason=member_data.join_reason
    )
    
    # Insertar en la base de datos
    try:
        result = await member_collection.insert_one(new_member.dict())
        created_member = await member_collection.find_one({"_id": result.inserted_id})
        
        # Actualizar contador de miembros en la comunidad
        await community_collection.update_one(
            {"id": member_data.community_id},
            {"$inc": {"members": 1}}
        )
        
        return created_member
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear miembro: {str(e)}"
        )

@router.get("/members/{community_id}",
    response_model=MemberListResponse,
    description="Obtener todos los miembros de una comunidad específica",
    responses={
        404: {"description": "Comunidad no encontrada"}
    }
)
async def get_all_members_by_community(community_id: str):
    # Verificar si la comunidad existe
    community = await community_collection.find_one({"id": community_id})
    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comunidad no encontrada"
        )
    
    # Obtener todos los miembros de la comunidad
    members_cursor = member_collection.find({"community_id": community_id})
    members = await members_cursor.to_list(length=None)
    
    # Contar miembros
    count = await member_collection.count_documents({"community_id": community_id})
    
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
