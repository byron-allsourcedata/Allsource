import logging
from fastapi import APIRouter, File, Form, UploadFile, status

from auth_dependencies import AuthUser
from domains.whitelabel.services.aws import WhitelabelAwsService

from .schemas import WhitelabelSettingsSchema
from .service import WhitelabelService

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/settings")
async def get_whitelabel_settings(
    user: AuthUser, whitelabel_service: WhitelabelService
) -> WhitelabelSettingsSchema:
    settings_schema = whitelabel_service.get_whitelabel_settings(user.get("id"))
    return settings_schema


@router.get("/is-enabled")
async def is_whitelabel_enabled(user: AuthUser) -> bool:
    return user.get("whitelabel_settings_enabled")


@router.post("/settings")
async def update_whitelabel_settings(
    user: AuthUser,
    service: WhitelabelService,
    brand_name: str = Form(...),
    logo: UploadFile = File(...),
    small_logo: UploadFile = File(...),
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

    # check that files have small enough size

    # upload files to s3

    # save links to db
    logger.info(logo.filename)
    logger.info(small_logo.filename)
    logger.info(brand_name)

    return
