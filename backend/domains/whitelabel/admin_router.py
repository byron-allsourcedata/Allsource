from fastapi import APIRouter, status

from db_dependencies import Db
from dependencies import AdminUser
from domains.users.exceptions import UserNotFound
from domains.whitelabel.service import WhitelabelService


router = APIRouter()


@router.post("/enable")
def enable_whitelabel_settings(
    _admin: AdminUser,
    user_id: int,
    db: Db,
    whitelabel_service: WhitelabelService,
):
    try:
        whitelabel_service.enable_whitelabel_settings(user_id)
        db.commit()
    except UserNotFound:
        return status.HTTP_404_NOT_FOUND


@router.post("/disable")
def enable_whitelabel_settings(
    _admin: AdminUser,
    user_id: int,
    db: Db,
    whitelabel_service: WhitelabelService,
):
    try:
        whitelabel_service.disable_whitelabel_settings(user_id)
        db.commit()
    except UserNotFound:
        return status.HTTP_404_NOT_FOUND
