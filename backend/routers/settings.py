from fastapi import APIRouter, Depends, Request as fastRequest

from models.users import User
from services.settings import SettingsService
from schemas import AccountDetailsRequest, TeamsDetailsRequest
from dependencies import get_settings_service, check_user_authorization_without_pixel
router = APIRouter()


@router.get("/account-details")
def get_account_details(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_my_details(user)

@router.put("/account-details")
def change_account_details(account_details: AccountDetailsRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.change_account_details(user, account_details)

@router.get("/teams")
def get_teams(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_my_teams(user)

@router.put("/teams")
def change_teams(teams_details: TeamsDetailsRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.change_teams_details(user, teams_details)

@router.get("/billing")
def get_teams(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_my_teams(user)

@router.put("/billing")
def change_teams(teams_details: TeamsDetailsRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.change_teams_details(user, teams_details)