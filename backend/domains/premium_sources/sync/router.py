from fastapi import APIRouter, Response
from uuid import UUID

from db_dependencies import Db
from dependencies import AuthUser
from domains.premium_sources.sync.schemas import (
    CreateGoogleAdsPremiumSyncRequest,
    CreateMetaPremiumSyncRequest,
)
from domains.premium_sources.sync.service import PremiumSourceSyncService
from services.integrations.meta import MetaError


router = APIRouter()


@router.post("/google-ads")
async def create_google_ads_premium_source_sync(
    user: AuthUser,
    db: Db,
    premium_source_sync_service: PremiumSourceSyncService,
    request: CreateGoogleAdsPremiumSyncRequest,
):
    _ = premium_source_sync_service.create_google_ads_sync_checked(
        user_id=user["id"],
        premium_source_id=request.premium_source_id,
        user_integration_id=request.user_integration_id,
        request=request,
    )
    db.commit()


@router.post("/meta")
async def create_meta_premium_source_sync(
    user: AuthUser,
    db: Db,
    premium_source_sync_service: PremiumSourceSyncService,
    premium_source_id: UUID,
    user_integration_id: int,
    request: CreateMetaPremiumSyncRequest,
):
    try:
        await premium_source_sync_service.create_meta_sync_checked(
            user_id=user["id"],
            premium_source_id=premium_source_id,
            user_integration_id=user_integration_id,
            request=request,
        )
        db.commit()
    except MetaError as e:
        return Response(status_code=403, content=e.user_message)


@router.get("/")
@router.get("")
async def get_premium_source_syncs(
    user: AuthUser,
    premium_source_sync_service: PremiumSourceSyncService,
):
    user_id = user["id"]
    return premium_source_sync_service.list(user_id=user_id)
