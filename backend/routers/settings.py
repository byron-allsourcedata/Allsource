from fastapi import APIRouter, Depends, Request as fastRequest, Query
from models.users import User
from services.settings import SettingsService
from schemas.settings import AccountDetailsRequest, TeamsDetailsRequest, ResetEmailForm
from dependencies import get_settings_service, check_user_authorization_without_pixel
router = APIRouter()


@router.get("/account-details")
def get_account_details(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_account_details(user=user)

@router.put("/account-details")
def change_account_details(account_details: AccountDetailsRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.change_account_details(user=user, account_details=account_details)

@router.post("/account-details/change-email")
def change_email_account_details(email_form: ResetEmailForm, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.change_email_account_details(user=user, email=email_form.email)

@router.get("/teams")
def get_teams(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_teams(user=user)

@router.put("/teams")
def change_teams(teams_details: TeamsDetailsRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.change_teams_details(user=user, teams_details=teams_details)

@router.get("/billing")
def get_billing(
    settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_billing(user=user)

@router.get("/billing-history")
def get_billing_history(
    page: int = Query(1, alias="page", ge=1, description="Page number"),
    per_page: int = Query(15, alias="per_page", ge=1, le=100, description="Items per page"),
    settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_billing_history(page=page, per_page=per_page, user=user)

@router.put("/billing")
def change_billing(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.change_billing_details(user=user)

@router.get("/subscription")
def get_subscription_plan(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_subscription_plan(user=user)

@router.get("/api-details")
def get_api_details(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_api_details(user=user)

@router.put("/api-details")
def change_api_details(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.change_api_details(user=user)