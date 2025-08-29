import logging
import os
from datetime import datetime
from typing import Optional

from fastapi import Depends, Header, HTTPException, Query, status
from jose import jwt, JWTError
from slack_sdk.signature import SignatureVerifier
from sqlalchemy.orm import Session
from starlette.exceptions import HTTPException
from starlette.requests import Request
from typing_extensions import Annotated

from config.auth import AuthConfig
from enums import DomainStatus, UserAuthorizationStatus, TeamAccessLevel
from exceptions import InvalidToken
from persistence.admin import AdminPersistence
from persistence.audience_dashboard import DashboardAudiencePersistence
from persistence.audience_insights import AudienceInsightsPersistence
from persistence.audience_lookalikes import AudienceLookalikesPersistence
from persistence.audience_persistence import AudiencePersistence
from persistence.audience_settings import AudienceSettingPersistence
from persistence.audience_smarts import AudienceSmartsPersistence
from persistence.audience_sources import AudienceSourcesPersistence
from persistence.audience_sources_matched_persons import (
    AudienceSourcesMatchedPersonsPersistence,
)
from persistence.company_persistence import CompanyPersistence
from persistence.domains import UserDomainsPersistence, UserDomains
from persistence.integrations.external_apps_installations import (
    ExternalAppsInstallationsPersistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_order_persistence import LeadOrdersPersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.million_verifier import MillionVerifierPersistence
from persistence.notification import NotificationPersistence
from persistence.partners_asset_persistence import PartnersAssetPersistence
from persistence.partners_persistence import PartnersPersistence
from persistence.plans_persistence import PlansPersistence
from persistence.referral_discount_code_persistence import (
    ReferralDiscountCodesPersistence,
)
from persistence.referral_payouts import ReferralPayoutsPersistence
from persistence.referral_user import ReferralUserPersistence
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.settings_persistence import SettingsPersistence
from persistence.suppression_persistence import SuppressionPersistence
from persistence.user_persistence import UserDict, UserPersistence
from schemas.auth_token import Token
from services.accounts import AccountsService
from services.admin_customers import AdminCustomersService
from services.audience_dashboard import DashboardAudienceService
from services.audience_insights import AudienceInsightsService
from services.audience_smarts import AudienceSmartsService
from services.audience_sources import AudienceSourceService
from services.aws import AWSService
from services.companies import CompanyService
from services.company_info import CompanyInfoService
from services.crm.service import CrmService
from services.dashboard import DashboardService
from services.domains import UserDomainsService
from services.integrations.base import IntegrationService
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from services.leads import LeadsService
from services.meeting_schedule import MeetingScheduleService
from services.notification import Notification
from services.partners import PartnersService
from services.partners_assets import PartnersAssetService
from services.payments import PaymentsService
from services.payments_plans import PaymentsPlans
from services.payouts import PayoutsService
from services.plans import PlansService
from services.privacy_policy import PrivacyPolicyService
from services.settings import SettingsService
from services.sse_events import SseEventsService
from services.stripe_service import StripeService, get_stripe_payment_url
from services.subscriptions import SubscriptionService
from services.suppression import SuppressionService
from services.user_name import UserNamesService
from services.users import UsersService
from services.users_auth import UsersAuth
from services.users_email_verification import UsersEmailVerificationService
from services.webhook import WebhookService
from db_dependencies import get_db

logger = logging.getLogger(__name__)


def check_service_secret_key(
    secret_key: str = Query(..., description="The secret key to verify access"),
) -> str:
    secret_pixel_key = os.getenv("SECRET_PIXEL_KEY")
    if secret_pixel_key is None or secret_key != secret_pixel_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return secret_key


SecretPixelKey = Annotated[str, Depends(check_service_secret_key)]
"""
    Used for authentication of pixel_checker service

    Must be provided as a query parameter
"""


async def verify_signature(request: Request):
    logger.debug("Starting verification")
    verifier = SignatureVerifier(os.getenv("SLACK_SIGNING_SECRET"))
    raw_body = await request.body()
    if verifier.is_valid_request(raw_body, dict(request.headers)) == False:
        logger.debug("Error verification")
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Forbidden")


def get_audience_setting_persistence(db: Session = Depends(get_db)):
    return AudienceSettingPersistence(db)


def get_audience_sources_matched_persons_persistence(
    db: Session = Depends(get_db),
):
    return AudienceSourcesMatchedPersonsPersistence(db)


def get_audience_smarts_persistence(db: Session = Depends(get_db)):
    return AudienceSmartsPersistence(db)


def get_partners_asset_persistence(
    db: Session = Depends(get_db),
) -> PartnersAssetPersistence:
    return PartnersAssetPersistence(db)


def get_million_verifier_persistence(db: Session = Depends(get_db)):
    return MillionVerifierPersistence(db=db)


def get_million_verifier_service(
    million_verifier_persistence: MillionVerifierPersistence = Depends(
        get_million_verifier_persistence
    ),
):
    return MillionVerifierIntegrationsService(
        million_verifier_persistence=million_verifier_persistence
    )


def get_company_persistence(db: Session = Depends(get_db)):
    return CompanyPersistence(db=db)


def get_suppression_persistence(
    db: Session = Depends(get_db),
) -> SuppressionPersistence:
    return SuppressionPersistence(db)


def get_user_persistence_service(db: Session = Depends(get_db)):
    return UserPersistence(db=db)


def get_audience_insights_persistence(db: Session = Depends(get_db)):
    return AudienceInsightsPersistence(db)


def get_audience_persistence(db: Session = Depends(get_db)):
    return AudiencePersistence(db=db)


def get_lead_orders_persistence(
    db: Session = Depends(get_db),
) -> LeadsPersistence:
    return LeadOrdersPersistence(db)


def get_integrations_user_sync_persistence(
    db: Session = Depends(get_db),
) -> IntegrationsUserSyncPersistence:
    return IntegrationsUserSyncPersistence(db)


def get_epi_persistence(
    db: Session = Depends(get_db),
) -> ExternalAppsInstallationsPersistence:
    return ExternalAppsInstallationsPersistence(db)


def get_notification_persistence(db: Session = Depends(get_db)):
    return NotificationPersistence(db)


def get_lookalikes_persistence(db: Session = Depends(get_db)):
    return AudienceLookalikesPersistence(db=db)


def get_accounts_service(
    user_persistence: UserPersistence,
    partner_persistence: PartnersPersistence,
    referral_user_persistence: ReferralUserPersistence,
):
    return AccountsService(
        referral_user_persistence=referral_user_persistence,
        user_persistence=user_persistence,
        partner_persistence=partner_persistence,
    )


def get_stripe_service():
    return StripeService()


def check_user_authentication(
    Authorization: Annotated[str, Header()],
    user_persistence_service: UserPersistence,
) -> Token:
    user_data = parse_jwt_data(Authorization)
    user = user_persistence_service.get_user_by_id(user_data.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"status": "NOT_FOUND"},
        )

    team_owner_id = user.get("team_owner_id")

    if team_owner_id is not None:
        user["id"] = team_owner_id

    if hasattr(user_data, "team_member_id") and user_data.team_member_id:
        team_memer = user_persistence_service.get_user_team_member_by_id(
            user_data.team_member_id
        )
        if team_memer.get("team_owner_id") is None or team_memer.get(
            "team_owner_id"
        ) != user.get("id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "status": UserAuthorizationStatus.TEAM_TOKEN_EXPIRED.value
                },
            )
        user["team_member"] = team_memer
    return user


AuthUser = Annotated[UserDict, Depends(check_user_authentication)]


def check_domain(
    domain_persistence: UserDomainsPersistence,
    CurrentDomain: Optional[str] = Header(None),
    user=Depends(check_user_authentication),
) -> UserDomains:
    current_domain = domain_persistence.get_domains_by_user(
        user.get("id"), domain_substr=CurrentDomain
    )
    if not CurrentDomain:
        return None
    if not current_domain or len(current_domain) == 0:
        if (
            user.get("is_email_confirmed") is False
            and user.get("is_with_card") is False
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"status": "NEED_CONFIRM_EMAIL"},
            )
        if user.get("is_company_details_filled") is False:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"status": "FILL_COMPANY_DETAILS"},
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": DomainStatus.DOMAIN_NOT_FOUND.value},
        )

    return current_domain[0]


def check_pixel_install_domain(domain: UserDomains = Depends(check_domain)):
    if domain is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "status": UserAuthorizationStatus.PIXEL_INSTALLATION_NEEDED.value
            },
        )
    if not (domain.is_pixel_installed):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "status": UserAuthorizationStatus.PIXEL_INSTALLATION_NEEDED.value
            },
        )
    return domain


def get_partners_assets_service(
    aws_service: AWSService,
    partners_asset_persistence: PartnersAssetPersistence = Depends(
        get_partners_asset_persistence
    ),
):
    return PartnersAssetService(partners_asset_persistence, aws_service)


def get_partners_service(
    user_persistence: UserPersistence,
    plans_persistence: PlansPersistence,
    partners_persistence: PartnersPersistence,
    send_grid_persistence: SendgridPersistence,
):
    return PartnersService(
        partners_persistence=partners_persistence,
        user_persistence=user_persistence,
        send_grid_persistence=send_grid_persistence,
        plans_persistence=plans_persistence,
    )


def get_user_authorization_status(user, users_auth_service: UsersAuth):
    status = users_auth_service.get_user_authorization_status_without_pixel(
        user
    )
    return status


def parse_jwt_data(Authorization: Annotated[str, Header()]) -> Token:
    access_token = Authorization.replace("Bearer ", "")
    try:
        data = jwt.decode(
            access_token,
            AuthConfig.secret_key,
            algorithms=["HS256"],
            audience="Filed-Client-Apps",
        )
        if datetime.utcnow() > datetime.fromtimestamp(data["exp"]):
            raise InvalidToken
        return Token(**data)
    except JWTError:
        raise InvalidToken


def raise_forbidden(detail: dict):
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def check_user_authorization(
    Authorization: Annotated[str, Header()],
    user_persistence_service: UserPersistence,
    privacy_policy_service: PrivacyPolicyService,
    users_auth_service: UsersAuth,
) -> Token:
    is_admin = is_user_admin(Authorization, user_persistence_service)
    user = check_user_authentication(Authorization, user_persistence_service)
    auth_status = get_user_authorization_status(user, users_auth_service)
    exist_privacy_policy = privacy_policy_service.exist_user_privacy_policy(
        user_id=user.get("id")
    )

    if auth_status == UserAuthorizationStatus.NEED_CONFIRM_EMAIL:
        raise_forbidden(
            {
                "status": UserAuthorizationStatus.NEED_CONFIRM_EMAIL.value,
            }
        )

    if not exist_privacy_policy and not is_admin:
        raise_forbidden(
            {"status": UserAuthorizationStatus.NEED_ACCEPT_PRIVACY_POLICY.value}
        )

    if not user.get("current_subscription_id") and not is_admin:
        raise_forbidden(
            {"status": UserAuthorizationStatus.NEED_PAY_BASIC.value}
        )

    if auth_status == UserAuthorizationStatus.PAYMENT_NEEDED:
        stripe_payment_url = get_stripe_payment_url(
            user.get("customer_id"),
            user.get("stripe_payment_url") or {},
        )
        raise_forbidden(
            {
                "status": auth_status.value,
                "stripe_payment_url": stripe_payment_url,
            }
        )

    if (
        auth_status != UserAuthorizationStatus.SUCCESS
        or auth_status != UserAuthorizationStatus.NEED_CHOOSE_PLAN
    ):
        raise_forbidden({"status": auth_status.value})
    return user


def check_user_authorization_without_pixel(
    Authorization: Annotated[str, Header()],
    user_persistence_service: UserPersistence,
    privacy_policy_service: PrivacyPolicyService,
    users_auth_service: UsersAuth,
) -> Token:
    is_admin = is_user_admin(Authorization, user_persistence_service)
    user = check_user_authentication(Authorization, user_persistence_service)
    auth_status = get_user_authorization_status(user, users_auth_service)
    exist_privacy_policy = privacy_policy_service.exist_user_privacy_policy(
        user_id=user.get("id")
    )

    if (
        auth_status == UserAuthorizationStatus.NEED_CONFIRM_EMAIL
        and not is_admin
    ):
        raise_forbidden(
            {
                "status": UserAuthorizationStatus.NEED_CONFIRM_EMAIL.value,
            }
        )

    if not exist_privacy_policy and not is_admin:
        raise_forbidden(
            {"status": UserAuthorizationStatus.NEED_ACCEPT_PRIVACY_POLICY.value}
        )

    if not user.get("current_subscription_id") and not is_admin:
        raise_forbidden(
            {"status": UserAuthorizationStatus.NEED_PAY_BASIC.value}
        )

    if auth_status == UserAuthorizationStatus.PAYMENT_NEEDED:
        stripe_payment_url = get_stripe_payment_url(
            user.get("customer_id"),
            user.get("stripe_payment_url") or {},
        )
        raise_forbidden(
            {
                "status": auth_status.value,
                "stripe_payment_url": stripe_payment_url,
            }
        )

    allowed_statuses = {
        UserAuthorizationStatus.SUCCESS,
        UserAuthorizationStatus.NEED_CHOOSE_PLAN,
        UserAuthorizationStatus.PIXEL_INSTALLATION_NEEDED,
    }

    if auth_status not in allowed_statuses and not is_admin:
        raise_forbidden({"status": auth_status.value})

    return user


def check_team_admin(
    Authorization: Annotated[str, Header()],
    user_persistence_service: UserPersistence,
) -> Token:
    user = check_user_authentication(Authorization, user_persistence_service)
    if user.get("team_member"):
        team_member = user.get("team_member")
        if team_member.get("team_access_level") not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only.",
            )
    return user


TeamAdmin = Annotated[UserDict, Depends(check_team_admin)]


def check_user_setting_access(
    Authorization: Annotated[str, Header()],
    user_persistence_service: UserPersistence,
    privacy_policy_service: PrivacyPolicyService,
    users_auth_service: UsersAuth,
) -> Token:
    user = check_user_authentication(Authorization, user_persistence_service)
    auth_status = get_user_authorization_status(user, users_auth_service)

    is_admin = is_user_admin(Authorization, user_persistence_service)
    exist_privacy_policy = privacy_policy_service.exist_user_privacy_policy(
        user_id=user.get("id")
    )

    if not exist_privacy_policy and not is_admin:
        raise_forbidden(
            {"status": UserAuthorizationStatus.NEED_ACCEPT_PRIVACY_POLICY.value}
        )

    if (
        auth_status != UserAuthorizationStatus.SUCCESS
        and auth_status != UserAuthorizationStatus.NEED_CHOOSE_PLAN
        and auth_status != UserAuthorizationStatus.PAYMENT_FAILED
        and auth_status != UserAuthorizationStatus.PIXEL_INSTALLATION_NEEDED
        and not is_admin
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"status": auth_status.value},
        )
    return user


def check_user_partner(
    Authorization: Annotated[str, Header()],
    user_persistence_service: UserPersistence,
) -> Token:
    user = check_user_authentication(Authorization, user_persistence_service)
    if not user["is_partner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"status": "Access Forbidden"},
        )
    return user


def check_team_access_standard_user(
    user: dict = Depends(check_user_authentication),
):
    if user.get("team_member"):
        team_member = user.get("team_member")
        if team_member.get("team_access_level") not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
            TeamAccessLevel.STANDARD.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only.",
            )
    return user


def check_team_access_owner_user(
    user: dict = Depends(check_user_authentication),
):
    if user.get("team_member"):
        team_member = user.get("team_member")
        if team_member.get("team_access_level") not in {
            TeamAccessLevel.OWNER.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Owner only.",
            )
    return user


def get_users_service(
    user_persistence: UserPersistence,
    meeting_schedule: MeetingScheduleService,
    subscription_service: SubscriptionService,
    plan_persistence: PlansPersistence,
    leads_persistence: LeadsPersistence,
    domain_persistence: UserDomainsPersistence,
    user=Depends(check_user_authentication),
):
    return UsersService(
        user=user,
        user_persistence_service=user_persistence,
        plan_persistence=plan_persistence,
        subscription_service=subscription_service,
        domain_persistence=domain_persistence,
        leads_persistence=leads_persistence,
        meeting_schedule=meeting_schedule,
    )


def get_notification_service(
    plan_persistence: PlansPersistence,
    subscription_service: SubscriptionService,
    leads_persistence: LeadsPersistence,
    notification_persistence: NotificationPersistence,
):
    return Notification(
        notification_persistence=notification_persistence,
        subscription_service=subscription_service,
        plan_persistence=plan_persistence,
        leads_persistence=leads_persistence,
    )


def get_domain_service(
    plan_persistence: PlansPersistence,
    subscription_service: SubscriptionService,
    user_domain_persistence: UserDomainsPersistence,
):
    return UserDomainsService(
        user_domain_persistence=user_domain_persistence,
        plan_persistence=plan_persistence,
        subscription_service=subscription_service,
    )


def get_leads_service(
    leads_persistence_service: LeadsPersistence,
    user=Depends(check_user_authorization),
    domain: UserDomains = Depends(check_pixel_install_domain),
):
    return LeadsService(
        domain=domain, leads_persistence_service=leads_persistence_service
    )


def get_companies_service(
    domain: UserDomains = Depends(check_pixel_install_domain),
    companies_persistence_service: CompanyPersistence = Depends(
        get_company_persistence
    ),
):
    return CompanyService(
        domain=domain, company_persistence_service=companies_persistence_service
    )


def get_sse_events_service(user_persistence_service: UserPersistence):
    return SseEventsService(user_persistence_service=user_persistence_service)


def get_dashboard_service(
    user_persistence: UserPersistence,
    leads_persistence_service: LeadsPersistence,
    domain: UserDomains = Depends(check_pixel_install_domain),
):
    return DashboardService(
        domain=domain,
        user_persistence=user_persistence,
        leads_persistence_service=leads_persistence_service,
    )


def get_audience_insights_service(
    audience_insights_persistence: AudienceInsightsPersistence = Depends(
        get_audience_insights_persistence
    ),
):
    return AudienceInsightsService(
        insights_persistence_service=audience_insights_persistence
    )


def get_payouts_service(
    stripe_service: StripeService,
    partners_persistence: PartnersPersistence,
    referral_payouts_persistence: ReferralPayoutsPersistence,
    referral_user_persistence: ReferralUserPersistence,
):
    return PayoutsService(
        referral_payouts_persistence=referral_payouts_persistence,
        referral_user_persistence=referral_user_persistence,
        partners_persistence=partners_persistence,
        stripe_service=stripe_service,
    )


def get_settings_service(
    user_domains_service: UserDomainsService,
    plan_persistence: PlansPersistence,
    user_persistence: UserPersistence,
    subscription_service: SubscriptionService,
    lead_persistence: LeadsPersistence,
    send_grid_persistence: SendgridPersistence,
    settings_persistence: SettingsPersistence,
):
    return SettingsService(
        settings_persistence=settings_persistence,
        plan_persistence=plan_persistence,
        user_persistence=user_persistence,
        send_grid_persistence=send_grid_persistence,
        subscription_service=subscription_service,
        user_domains_service=user_domains_service,
        lead_persistence=lead_persistence,
    )


def get_suppression_service(
    leads_persistence: LeadsPersistence,
    suppression_persistence: SuppressionPersistence = Depends(
        get_suppression_persistence
    ),
):
    return SuppressionService(
        suppression_persistence=suppression_persistence,
        leads_persistence=leads_persistence,
    )


def get_plans_service(
    plans_persistence: PlansPersistence,
    subscription_service: SubscriptionService,
):
    return PlansService(
        plans_persistence=plans_persistence,
        subscription_service=subscription_service,
    )


def get_webhook(
    subscription_service: SubscriptionService,
    notification_persistence: NotificationPersistence,
    integration_service: IntegrationService,
):
    return WebhookService(
        subscription_service=subscription_service,
        notification_persistence=notification_persistence,
        integration_service=integration_service,
    )


def get_payments_service(
    plan_persistence: PlansPersistence,
    plans_service: PlansService,
    subscription_service: SubscriptionService,
    referral_discount_codes_persistence: ReferralDiscountCodesPersistence,
    integration_service: IntegrationService,
):
    return PaymentsService(
        plans_service=plans_service,
        plan_persistence=plan_persistence,
        subscription_service=subscription_service,
        integration_service=integration_service,
        referral_discount_codes_persistence=referral_discount_codes_persistence,
    )


def get_company_info_service(
    subscription_service: SubscriptionService,
    partners_persistence: PartnersPersistence,
    db: Session = Depends(get_db),
    user=Depends(check_user_authentication),
):
    return CompanyInfoService(
        db=db,
        user=user,
        subscription_service=subscription_service,
        partners_persistence=partners_persistence,
    )


def get_users_email_verification_service(
    user_persistence_service: UserPersistence,
    sendgrid_persistence_service: SendgridPersistence,
    user=Depends(check_user_authentication),
):
    return UsersEmailVerificationService(
        user=user,
        user_persistence_service=user_persistence_service,
        send_grid_persistence_service=sendgrid_persistence_service,
    )


def check_user_admin(
    Authorization: Annotated[str, Header()],
    user_persistence_service: UserPersistence,
) -> Token:
    user = check_user_authentication(Authorization, user_persistence_service)
    if "admin" not in user["role"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"status": "FORBIDDEN"},
        )
    return user


Admin = Annotated[Token, Depends(check_user_admin)]


def is_user_admin(
    authorization: Annotated[str, Header()],
    user_persistence_service: UserPersistence,
) -> bool:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Invalid Authorization header format"
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(
            token, AuthConfig.secret_key, algorithms=[AuthConfig.algorithm]
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    requester_user_id = payload.get("requester_access_user_id") or payload.get(
        "id"
    )
    if not requester_user_id:
        return False

    user = user_persistence_service.get_user_by_id(requester_user_id)
    if not user:
        return False

    return "admin" in (user.get("role") or "")


AdminUser = Annotated[UserDict, Depends(check_user_admin)]


def check_api_key(
    domain_persistence: UserDomainsPersistence,
    maximiz_api_key=Header(None),
):
    if maximiz_api_key:
        domains = domain_persistence.get_domain_by_filter(
            api_key=maximiz_api_key
        )
        if domains:
            return domains[0]
        raise HTTPException(
            status_code=404,
            detail={"status": DomainStatus.DOMAIN_NOT_FOUND.value},
        )
    raise HTTPException(
        status_code=401,
        detail={"status": UserAuthorizationStatus.INVALID_API_KEY.value},
    )
