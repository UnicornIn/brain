
from fastapi import APIRouter
from app.community.community_member.member import router as member_router
from app.community.module_community.community import router as community_router

router = APIRouter()

router.include_router(member_router)
router.include_router(community_router)

    