from fastapi import APIRouter, HTTPException, status
from app.database.mongo import community_collection
from app.community.module_community.models import CommunityResponse
from app.community.module_community.upload_file import upload_image_to_s3
from app.community.module_community.upload_file import delete_image_from_s3
from fastapi.security import OAuth2PasswordBearer
# from app.auth.jwt.jwt import get_current_user # Uncomment if you need to use authentication
# from fastapi import Depends
from fastapi import Path
from urllib.parse import urlparse
from fastapi import Form
from typing import Optional
from fastapi import UploadFile, File
from datetime import datetime
from typing import List 
import uuid

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
router = APIRouter()

@router.post("/communities/", response_model=CommunityResponse)
async def create_community_with_image(
    title: str = Form(...),
    description: str = Form(...),
    url: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    try:
        existing = await community_collection.find_one({"url": url})
        if existing:
            raise HTTPException(status_code=400, detail="A community with this URL already exists")

        community_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()

        image_url = None
        if image:
            image_url = await upload_image_to_s3(image)

        community_doc = {
            "id": community_id,
            "title": title,
            "description": description,
            "url": url,
            "members": 0,
            "created_at": created_at,
            "image_url": image_url
        }

        result = await community_collection.insert_one(community_doc)

        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create community")

        return CommunityResponse(
            id=community_id,
            title=title,
            description=description,
            url=url,
            members=0,
            created_at=created_at,
            image=image_url
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get-communities/", response_model=List[CommunityResponse])
async def get_all_communities():
    """
    Get all communities from the database.
    Returns:
    - List of all communities with their full information
    """
    try:
        communities = []
        async for community in community_collection.find():
            communities.append(CommunityResponse(
                id=community["id"],
                title=community["title"],
                description=community["description"],
                url=community["url"],
                members=community["members"],
                created_at=community["created_at"],
                image=community.get("image_url") 
            ))
        return communities

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/communities/{community_id}", response_model=CommunityResponse)
async def update_community(
    community_id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    try:
        update_data = {}

        if title and title.strip() and title != "string":
            update_data["title"] = title
        if description and description.strip() and description != "string":
            update_data["description"] = description
        if url and url.strip() and url != "string":
            update_data["url"] = url

        if image:
            # Buscar imagen anterior y eliminarla
            existing = await community_collection.find_one({"id": community_id})
            if existing and "image_url" in existing and existing["image_url"]:
                from urllib.parse import urlparse
                path = urlparse(existing["image_url"]).path.lstrip("/")
                await delete_image_from_s3(path)

            # Subir nueva imagen
            image_url = await upload_image_to_s3(image)
            update_data["image_url"] = image_url

        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields provided for update")

        result = await community_collection.update_one(
            {"id": community_id},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Community not found")

        # Obtener y devolver la comunidad actualizada
        updated = await community_collection.find_one({"id": community_id})
        if not updated:
            raise HTTPException(status_code=404, detail="Community not found after update")

        return CommunityResponse(
            id=updated["id"],
            title=updated["title"],
            description=updated["description"],
            url=updated["url"],
            members=updated["members"],
            created_at=updated["created_at"],
            image=updated.get("image_url")  # Aquí usamos el campo `image` del response model
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/communities/{community_id}", status_code=204)
async def delete_community(community_id: str = Path(..., description="UUID de la comunidad")):
    try:
        # Buscar comunidad por ID
        community = await community_collection.find_one({"id": community_id})
        if not community:
            raise HTTPException(status_code=404, detail="Community not found")

        # Si tiene imagen, eliminarla del bucket
        image_url = community.get("image_url")
        if image_url:
            # Extraer path del archivo desde la URL
            path = urlparse(image_url).path.lstrip("/")
            await delete_image_from_s3(path)

        # Eliminar de la base de datos
        result = await community_collection.delete_one({"id": community_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Failed to delete community")

        return  # Status 204: No Content

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/communities/by-slug/{slug}", response_model=CommunityResponse)
async def get_community_by_slug(slug: str):
    try:
        # Try with slash first
        formatted_slug = f"/{slug.lstrip('/')}"
        community = await community_collection.find_one({"url": formatted_slug})
        
        # If not found, try without slash
        if not community:
            community = await community_collection.find_one({"url": slug.lstrip('/')})
        
        if not community:
            raise HTTPException(status_code=404, detail="Community not found")

        return CommunityResponse(
            id=community["id"],
            title=community["title"],
            description=community["description"],
            url=community["url"],
            members=community["members"],
            created_at=community["created_at"],
            image=community.get("image_url")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/communities/{community_url}",
    response_model=CommunityResponse,
    description="Obtener los datos de una comunidad por su URL",
    responses={
        404: {"description": "Comunidad no encontrada"}
    }
)
async def get_community_by_url(community_url: str):
    # Verificar si la comunidad existe por su URL
    community = await community_collection.find_one({"url": community_url})
    if not community:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comunidad no encontrada"
        )
    
    # Convertir ObjectId a string si es necesario
    if "_id" in community:
        community["id"] = str(community["_id"])
        del community["_id"]
    
    # Mapear correctamente los campos de la base de datos al modelo de respuesta
    community_data = {
        "id": community.get("id"),
        "title": community.get("title"),
        "description": community.get("description"),
        "url": community.get("url"),
        "members": community.get("members", 0),  # Valor por defecto si no existe
        "created_at": community.get("created_at"),
        "image": community.get("image_url")  # Mapear image_url de MongoDB a image del modelo
    }
    
    return CommunityResponse(**community_data)
