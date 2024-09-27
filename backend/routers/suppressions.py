from fastapi import APIRouter, Depends
from models.users import User
from services.settings import SettingsService
from dependencies import get_settings_service, check_user_authorization


router = APIRouter()


@router.get("/account-details")
def get_account_details(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization)):
    return settings_service.get_account_details(user=user)
