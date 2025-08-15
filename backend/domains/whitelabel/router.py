import logging
from fastapi import APIRouter, File, Form, UploadFile, status

from auth_dependencies import AuthUser, MaybeAuthUser
from db_dependencies import Db
from domains.referrals.exceptions import InvalidReferralCode

from .schemas import WhitelabelSettingsSchema
from .service import WhitelabelService

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/own-settings")
async def get_whitelabel_settings(
    user: AuthUser, whitelabel_service: WhitelabelService
) -> WhitelabelSettingsSchema:
    settings_schema = whitelabel_service.get_own_whitelabel_settings(
        user.get("id")
    )
    return settings_schema


@router.get("/is-enabled")
async def is_whitelabel_enabled(user: AuthUser) -> bool:
    return user.get("whitelabel_settings_enabled")


@router.get("/settings")
@router.get("/icons")
async def get_whitelabel_icons(
    whitelabel_service: WhitelabelService,
    user: MaybeAuthUser,
    referral: str | None = None,
) -> WhitelabelSettingsSchema:
    if user is not None:
        user_id = user.get("id")
        return whitelabel_service.get_whitelabel_settings(user_id)

    if referral is not None:
        try:
            return whitelabel_service.get_whitelabel_settings_by_referral_code(
                referral
            )
        except InvalidReferralCode:
            return whitelabel_service.default_whitelabel_settings()
    return whitelabel_service.default_whitelabel_settings()


@router.post("/settings")
async def update_whitelabel_settings(
    user: AuthUser,
    db: Db,
    service: WhitelabelService,
    brand_name: str = Form(...),
    logo: UploadFile | None = File(None),
    small_logo: UploadFile | None = File(None),
    meeting_url: str | None = Form(None),
):
    if not user["whitelabel_settings_enabled"]:
        logger.info(
            f"user {user['email']} tried to update whitelabel settings, even though it is disabled"
        )
        return status.HTTP_404_NOT_FOUND

    service.update_whitelabel_settings(
        user_id=user["id"],
        brand_name=brand_name,
        brand_logo=logo,
        brand_icon=small_logo,
        meeting_url=meeting_url,
    )

    db.commit()
