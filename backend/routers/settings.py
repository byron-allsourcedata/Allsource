from fastapi import APIRouter, Depends, Request as fastRequest, Query, HTTPException, status
from models.users import User
from services.settings import SettingsService
from schemas.settings import AccountDetailsRequest, TeamsDetailsRequest, SendBilling, PaymentCard, ApiKeysRequest
from dependencies import get_settings_service, check_user_authorization_without_pixel, check_user_authentication
from schemas.users import VerifyTokenResponse
from starlette.responses import StreamingResponse
from enums import TeamAccessLevel

router = APIRouter()


@router.get("/account-details")
def get_account_details(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authentication)):
    return settings_service.get_account_details(user=user)

@router.put("/account-details")
def change_account_details(account_details: AccountDetailsRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.change_account_details(user=user, account_details=account_details)

@router.get("/account-details/change-email")
def change_email_account_details(settings_service: SettingsService = Depends(get_settings_service), token: str = Query(...), mail: str = Query(...)):
    result = settings_service.change_email_account_details(token=token, email=mail)
    return VerifyTokenResponse(status=result.get('status'), token=result.get('user_token', None))

@router.get("/teams")
def get_teams(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_team_members(user=user)

@router.get("/teams/pending-invations")
def get_pending_invations(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_pending_invations(user=user)

@router.put("/teams")
def change_teams(teams_details: TeamsDetailsRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )

    return settings_service.change_teams(user=user, teams_details=teams_details)

@router.post("/teams")
def invite_user(teams_details: TeamsDetailsRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )
    return settings_service.invite_user(user=user, invite_user=teams_details.invite_user, access_level=teams_details.access_level)

@router.post("/teams/change-user-role")
def change_user_role(teams_details: TeamsDetailsRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.OWNER.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )
    return settings_service.change_user_role(user=user, email=teams_details.invite_user, access_level=teams_details.access_level)

@router.get("/teams/check-team-invitations-limit")
def check_team_invitations_limit(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )
    return settings_service.check_team_invitations_limit(user=user)

@router.get("/billing")
def get_billing(
    settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authentication)):
    return settings_service.get_billing(user=user)

@router.get("/billing-history")
def get_billing_history(
    page: int = Query(1, alias="page", ge=1, description="Page number"),
    per_page: int = Query(15, alias="per_page", ge=1, le=100, description="Items per page"),
    settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authentication)):
    return settings_service.get_billing_history(page=page, per_page=per_page, user=user)

@router.post("/billing/add-card")
def add_card(payment_card: PaymentCard, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authentication)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )
    return settings_service.add_card(user=user, payment_method_id=payment_card.payment_method_id)

@router.delete("/billing/delete-card")
def delete_card(payment_card: PaymentCard, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authentication)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') != TeamAccessLevel.ADMIN.value or team_member.get('team_access_level') != TeamAccessLevel.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )
    return settings_service.delete_card(payment_method_id=payment_card.payment_method_id)

@router.post("/billing/overage")
def billing_overage(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authentication)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') != TeamAccessLevel.ADMIN.value or team_member.get('team_access_level') != TeamAccessLevel.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )
    return settings_service.billing_overage(user=user)

@router.get("/billing/download-billing")
def download_billing(invoice_id: str = Query(...), settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authentication)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') != TeamAccessLevel.ADMIN.value or team_member.get('team_access_level') != TeamAccessLevel.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )
    return settings_service.download_billing(invoice_id=invoice_id)
    
@router.post("/billing/send-billing")
def send_billing(send_billing: SendBilling, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authentication)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') != TeamAccessLevel.ADMIN.value or team_member.get('team_access_level') != TeamAccessLevel.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )
    return settings_service.send_billing(invoice_id=send_billing.invoice_id, email=send_billing.email, user=user)


@router.put("/billing/default-card")
def default_card(payment_card: PaymentCard, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authentication)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') != TeamAccessLevel.ADMIN.value or team_member.get('team_access_level') != TeamAccessLevel.OWNER.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )
    return settings_service.default_card(user=user, payment_method_id=payment_card.payment_method_id)

@router.get("/api-details")
def get_api_details(settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.get_api_details(user=user)

@router.put("/api-details")
def change_api_details(api_keys_request: ApiKeysRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.change_api_details(user=user, api_keys_request=api_keys_request)

@router.put("/api-details/usage")
def change_api_details(api_keys_request: ApiKeysRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.change_api_details(user=user, api_keys_request=api_keys_request)

@router.post("/api-details")
def change_api_details(api_keys_request: ApiKeysRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.insert_api_details(user=user, api_keys_request=api_keys_request)

@router.delete("/api-details")
def change_api_details(api_keys_request: ApiKeysRequest, settings_service: SettingsService = Depends(get_settings_service), user: User = Depends(check_user_authorization_without_pixel)):
    return settings_service.delete_api_details(user=user, api_keys_request=api_keys_request)