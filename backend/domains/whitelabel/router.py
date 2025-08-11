from fastapi import APIRouter

from auth_dependencies import AuthUser


from .schemas import WhitelabelSettingsSchema
from .service import WhitelabelService

router = APIRouter()


@router.get("/settings")
async def get_whitelabel_settings(
    user: AuthUser, whitelabel_service: WhitelabelService
) -> WhitelabelSettingsSchema:
    settings_schema = whitelabel_service.get_whitelabel_settings(user.get("id"))
    return settings_schema


@router.get("/is-enabled")
async def is_whitelabel_enabled(user: "AuthUser") -> bool:
    return user.get("whitelabel_settings_enabled")


@router.post("/settings")
async def update_whitelabel_settings():
    return
