import logging
from fastapi import APIRouter, File, Form, UploadFile, status

from auth_dependencies import AuthUser
from db_dependencies import Db
from domains.referrals.exceptions import InvalidReferralCode
from domains.whitelabel.services.aws import WhitelabelAwsService

from .schemas import WhitelabelSettingsSchema
from .service import WhitelabelService

router = APIRouter()

logger = logging.getLogger(__name__)


# @router.get("/settings")
# async def get_whitelabel_settings(
#     user: AuthUser, whitelabel_service: WhitelabelService
# ) -> WhitelabelSettingsSchema:
#     settings_schema = whitelabel_service.get_whitelabel_settings(user.get("id"))
#     return settings_schema


@router.get("/is-enabled")
async def is_whitelabel_enabled(user: AuthUser) -> bool:
    logger.info(
        "user whitelabel enabled: "
        + str(user.get("whitelabel_settings_enabled"))
    )
    return user.get("whitelabel_settings_enabled")


@router.get("/settings")
@router.get("/icons")
async def get_whitelabel_icons(
    whitelabel_service: WhitelabelService,
    referral: str | None = None,
    user: AuthUser | None = None,
) -> WhitelabelSettingsSchema:
    logger.info(f"Provided referral code: {referral}")
    if user is not None:
        user_id = user.get("id")
        return whitelabel_service.get_whitelabel_settings(user_id)

    if referral is not None:
        try:
            return whitelabel_service.get_whitelabel_settings_by_referral_code(
                referral
            )
        except InvalidReferralCode:
            logger.info("Invalid Referral Code")
            return whitelabel_service.default_whitelabel_settings()

    logger.info("No authorization or referral code provided")
    return whitelabel_service.default_whitelabel_settings()


@router.post("/settings")
async def update_whitelabel_settings(
    user: AuthUser,
    db: Db,
    service: WhitelabelService,
    brand_name: str = Form(...),
    logo: UploadFile | None = File(None),
    small_logo: UploadFile | None = File(None),
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
    )

    db.commit()
