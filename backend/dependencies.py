import logging
import hmac
import os
import time
import math
from hashlib import sha256
from slack_sdk.signature import SignatureVerifier
from datetime import datetime
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing_extensions import Annotated
from starlette.requests import Request
from starlette.exceptions import HTTPException
from config.auth import AuthConfig
from config.aws import get_s3_client
from config.database import SessionLocal
from enums import DomainStatus, UserAuthorizationStatus, TeamAccessLevel
from exceptions import InvalidToken
from models.users import Users as User
from persistence.audience_dashboard import DashboardAudiencePersistence
from persistence.audience_settings import AudienceSettingPersistence
from persistence.audience_insights import AudienceInsightsPersistence
from persistence.audience_sources import AudienceSourcesPersistence
from persistence.audience_smarts import AudienceSmartsPersistence
from persistence.company_persistence import CompanyPersistence
from persistence.audience_lookalikes import AudienceLookalikesPersistence
from persistence.referral_user import ReferralUserPersistence
from persistence.referral_payouts import ReferralPayoutsPersistence
from persistence.audience_persistence import AudiencePersistence
from persistence.domains import UserDomainsPersistence, UserDomains
from persistence.million_verifier import MillionVerifierPersistence
from services.audience_insights import AudienceInsightsService
from services.companies import CompanyService
from services.lookalikes import AudienceLookalikesService
from services.payouts import PayoutsService
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from services.integrations.slack import SlackService
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.integrations.suppression import IntegrationsSuppressionPersistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_order_persistence import LeadOrdersPersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.notification import NotificationPersistence
from persistence.plans_persistence import PlansPersistence
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.settings_persistence import SettingsPersistence
from persistence.suppression_persistence import SuppressionPersistence
from persistence.audience_sources_matched_persons import AudienceSourcesMatchedPersonsPersistence
from persistence.partners_asset_persistence import PartnersAssetPersistence
from persistence.partners_persistence import PartnersPersistence
from persistence.user_persistence import UserPersistence
from persistence.integrations.external_apps_installations import ExternalAppsInstallationsPersistence
from persistence.referral_discount_code_persistence import ReferralDiscountCodesPersistence
from schemas.auth_token import Token
from services.audience_sources import AudienceSourceService
from services.audience_smarts import AudienceSmartsService
from services.audience_dashboard import DashboardAudienceService
from services.accounts import AccountsService
from services.admin_customers import AdminCustomersService
from services.audience import AudienceService
from services.aws import AWSService
from services.company_info import CompanyInfoService
from services.dashboard import DashboardService
from services.domains import UserDomainsService
from services.integrations.base import IntegrationService
from services.leads import LeadsService
from services.notification import Notification
from services.payments import PaymentsService
from services.payments_plans import PaymentsPlans
from services.pixel_installation import PixelInstallationService
from services.plans import PlansService
from services.settings import SettingsService
from services.similar_audiences import SimilarAudienceService
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService
from services.sse_events import SseEventsService
from services.subscriptions import SubscriptionService
from services.stripe_service import StripeService, get_stripe_payment_url
from services.suppression import SuppressionService
from services.users import UsersService
from services.users_auth import UsersAuth
from services.users_email_verification import UsersEmailVerificationService
from services.webhook import WebhookService
from services.partners_assets import PartnersAssetService
from services.partners import PartnersService
from services.referral import ReferralService

logger = logging.getLogger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Db = Annotated[Session, Depends(get_db)]

async def verify_signature(request: Request):
    logger.debug("Starting verification")
    verifier = SignatureVerifier(os.getenv('SLACK_SIGNING_SECRET'))
    raw_body = await request.body()
    if verifier.is_valid_request(raw_body, dict(request.headers)) == False:
        logger.debug("Error verification")
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Forbidden")


def get_audience_sources_persistence(db: Session = Depends(get_db)):
    return AudienceSourcesPersistence(db)

def get_audience_setting_persistence(db: Session = Depends(get_db)):
    return AudienceSettingPersistence(db)

def get_audience_sources_matched_persons_persistence(db: Session = Depends(get_db)):
    return AudienceSourcesMatchedPersonsPersistence(db)


def get_audience_smarts_persistence(db: Session = Depends(get_db)):
    return AudienceSmartsPersistence(db)


def get_partners_asset_persistence(db: Session = Depends(get_db)) -> PartnersAssetPersistence:
    return PartnersAssetPersistence(db)


def get_partners_persistence(db: Session = Depends(get_db)) -> PartnersPersistence:
    return PartnersPersistence(db)


def get_referral_user_persistence(db: Session = Depends(get_db)) -> ReferralUserPersistence:
    return ReferralUserPersistence(db)


def get_referral_discount_codes_persistence(db: Session = Depends(get_db)) -> ReferralDiscountCodesPersistence:
    return ReferralDiscountCodesPersistence(db)


def get_plans_persistence(db: Session = Depends(get_db)):
    return PlansPersistence(db=db)


def get_million_verifier_persistence(db: Session = Depends(get_db)):
    return MillionVerifierPersistence(db=db)


def get_referral_payouts_persistence(db: Session = Depends(get_db)):
    return ReferralPayoutsPersistence(db=db)


def get_million_verifier_service(
        million_verifier_persistence: MillionVerifierPersistence = Depends(get_million_verifier_persistence)):
    return MillionVerifierIntegrationsService(million_verifier_persistence=million_verifier_persistence)


def get_leads_persistence(db: Session = Depends(get_db)):
    return LeadsPersistence(db=db)


def get_company_persistence(db: Session = Depends(get_db)):
    return CompanyPersistence(db=db)


def get_suppression_persistence(db: Session = Depends(get_db)) -> SuppressionPersistence:
    return SuppressionPersistence(db)


def get_send_grid_persistence_service(db: Session = Depends(get_db)):
    return SendgridPersistence(db=db)


def get_settings_persistence(db: Session = Depends(get_db)):
    return SettingsPersistence(db=db)


def get_referral_persistence_service(db: Session = Depends(get_db)):
    return ReferralDiscountCodesPersistence(db=db)


def get_user_persistence_service(db: Session = Depends(get_db)):
    return UserPersistence(db=db)


def get_dashboard_audience_persistence(db: Session = Depends(get_db)):
    return DashboardAudiencePersistence(db)


def get_audience_insights_persistence(db: Session = Depends(get_db)):
    return AudienceInsightsPersistence(db)


def get_audience_persistence(db: Session = Depends(get_db)):
    return AudiencePersistence(db=db)


def get_user_integrations_presistence(db: Session = Depends(get_db)) -> IntegrationsPresistence:
    return IntegrationsPresistence(db)


def get_lead_orders_persistence(db: Session = Depends(get_db)) -> LeadsPersistence:
    return LeadOrdersPersistence(db)


def get_integrations_user_sync_persistence(db: Session = Depends(get_db)) -> IntegrationsUserSyncPersistence:
    return IntegrationsUserSyncPersistence(db)


def get_user_domain_persistence(db: Session = Depends(get_db)) -> UserDomainsPersistence:
    return UserDomainsPersistence(db)


def get_epi_persistence(db: Session = Depends(get_db)) -> ExternalAppsInstallationsPersistence:
    return ExternalAppsInstallationsPersistence(db)


def get_notification_persistence(db: Session = Depends(get_db)):
    return NotificationPersistence(db)


def get_lookalikes_persistence(db: Session = Depends(get_db)):
    return AudienceLookalikesPersistence(db=db)


def get_accounts_service(
        referral_user_persistence: ReferralUserPersistence = Depends(get_referral_user_persistence),
        user_persistence: UserPersistence = Depends(get_user_persistence_service),
        partner_persistence: PartnersPersistence = Depends(get_partners_persistence)):
    return AccountsService(referral_user_persistence=referral_user_persistence, user_persistence=user_persistence,
                           partner_persistence=partner_persistence)


def get_aws_service(s3_client=Depends(get_s3_client)) -> AWSService:
    return AWSService(s3_client)


def get_audience_sources_service(
        audience_sources_persistence: AudienceSourcesPersistence = Depends(get_audience_sources_persistence),
        audience_sources_matched_persons_persistence: AudienceSourcesMatchedPersonsPersistence = Depends(
            get_audience_sources_matched_persons_persistence),
        domain_persistence: UserDomainsPersistence = Depends(get_user_domain_persistence)):
    return AudienceSourceService(audience_sources_persistence=audience_sources_persistence,
                                 domain_persistence=domain_persistence,
                                 audience_sources_matched_persons_persistence=audience_sources_matched_persons_persistence)


def get_audience_smarts_service(
        audience_smarts_persistence: AudienceSmartsPersistence = Depends(get_audience_smarts_persistence),
        lookalikes_persistence_service: AudienceLookalikesPersistence = Depends(get_lookalikes_persistence),
        audience_sources_persistence: AudienceSourcesPersistence = Depends(get_audience_sources_persistence),
        audience_settings_persistence: AudienceSettingPersistence = Depends(get_audience_setting_persistence)
):
    return AudienceSmartsService(audience_smarts_persistence=audience_smarts_persistence,
                                 lookalikes_persistence_service=lookalikes_persistence_service,
                                 audience_sources_persistence=audience_sources_persistence,
                                 audience_settings_persistence=audience_settings_persistence)


def get_slack_service(
        user_persistence: UserPersistence = Depends(get_user_persistence_service),
        lead_persistence: LeadsPersistence = Depends(get_leads_persistence),
        user_integrations_persistence: IntegrationsPresistence = Depends(get_user_integrations_presistence),
        sync_persistence: IntegrationsUserSyncPersistence = Depends(get_integrations_user_sync_persistence),
        million_verifier_integrations: MillionVerifierIntegrationsService = Depends(get_million_verifier_service)):
    return SlackService(user_persistence=user_persistence, user_integrations_persistence=user_integrations_persistence,
                        sync_persistence=sync_persistence, lead_persistence=lead_persistence,
                        million_verifier_integrations=million_verifier_integrations)


def get_stripe_service():
    return StripeService()


def get_referral_service(
        referral_persistence_discount_code: ReferralDiscountCodesPersistence = Depends(
            get_referral_persistence_service),
        user_persistence: UserPersistence = Depends(get_user_persistence_service),
        stripe_service: StripeService = Depends(get_stripe_service),
        referral_payouts_persistence: ReferralPayoutsPersistence = Depends(get_referral_payouts_persistence),
        referral_user_persistence: ReferralUserPersistence = Depends(get_referral_user_persistence)):
    return ReferralService(referral_persistence_discount_code_service=referral_persistence_discount_code,
                           user_persistence=user_persistence,
                           stripe_service=stripe_service, referral_payouts_persistence=referral_payouts_persistence,
                           referral_persistence_service=referral_user_persistence)


def check_user_authentication(Authorization: Annotated[str, Header()],
                              user_persistence_service: UserPersistence = Depends(
                                  get_user_persistence_service)) -> Token:
    user_data = parse_jwt_data(Authorization)
    user = user_persistence_service.get_user_by_id(user_data.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                'status': 'NOT_FOUND'
            }
        )
    if hasattr(user_data, 'team_member_id') and user_data.team_member_id:
        team_memer = user_persistence_service.get_user_team_member_by_id(user_data.team_member_id)
        if team_memer.get('team_owner_id') is None or team_memer.get('team_owner_id') != user.get('id'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={'status': UserAuthorizationStatus.TEAM_TOKEN_EXPIRED.value}
            )
        user['team_member'] = team_memer
    return user


def check_domain(
        CurrentDomain: Optional[str] = Header(None),
        user=Depends(check_user_authentication),
        domain_persistence: UserDomainsPersistence = Depends(get_user_domain_persistence)
) -> UserDomains:
    current_domain = domain_persistence.get_domains_by_user(user.get('id'), domain_substr=CurrentDomain)
    if not CurrentDomain:
        return None
    if not current_domain or len(current_domain) == 0:
        if user.get('is_email_confirmed') is False and user.get('is_with_card') is False:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={'status': 'NEED_CONFIRM_EMAIL'})
        if user.get('is_company_details_filled') is False:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={'status': 'FILL_COMPANY_DETAILS'})
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={'status': "DOMAIN_NOT_FOUND"})

    return current_domain[0]


def check_pixel_install_domain(domain: UserDomains = Depends(check_domain)):
    if domain and not domain.is_pixel_installed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail={'status': UserAuthorizationStatus.PIXEL_INSTALLATION_NEEDED.value})
    return domain


def get_subscription_service(db: Session = Depends(get_db),
                             user_persistence_service: UserPersistence = Depends(get_user_persistence_service),
                             plans_persistence: PlansPersistence = Depends(get_plans_persistence),
                             referral_service: ReferralService = Depends(get_referral_service),
                             partners_persistence: PartnersPersistence = Depends(get_partners_persistence)):
    return SubscriptionService(db=db, user_persistence_service=user_persistence_service,
                               plans_persistence=plans_persistence, referral_service=referral_service,
                               partners_persistence=partners_persistence)


def get_partners_assets_service(
        partners_asset_persistence: PartnersAssetPersistence = Depends(get_partners_asset_persistence),
        aws_service: AWSService = Depends(get_aws_service)):
    return PartnersAssetService(
        partners_asset_persistence,
        aws_service
    )


def get_payments_plans_service(db: Session = Depends(get_db),
                               subscription_service: SubscriptionService = Depends(get_subscription_service),
                               user_persistence_service: UserPersistence = Depends(get_user_persistence_service)):
    return PaymentsPlans(db=db, subscription_service=subscription_service,
                         user_persistence_service=user_persistence_service)


def get_integration_service(db: Session = Depends(get_db),
                            audience_persistence=Depends(get_audience_persistence),
                            integration_presistence: IntegrationsPresistence = Depends(
                                get_user_integrations_presistence),
                            lead_presistence: LeadsPersistence = Depends(get_leads_persistence),
                            lead_orders_persistence: LeadOrdersPersistence = Depends(get_lead_orders_persistence),
                            integrations_user_sync_persistence: IntegrationsUserSyncPersistence = Depends(
                                get_integrations_user_sync_persistence),
                            aws_service: AWSService = Depends(get_aws_service),
                            domain_persistence=Depends(get_user_domain_persistence),
                            suppression_persitence: IntegrationsSuppressionPersistence = Depends(
                                get_suppression_persistence),
                            user_persistence: UserPersistence = Depends(get_user_persistence_service),
                            epi_persistence: ExternalAppsInstallationsPersistence = Depends(get_epi_persistence),
                            million_verifier_integrations: MillionVerifierIntegrationsService = Depends(
                                get_million_verifier_service)
                            ):
    return IntegrationService(db=db,
                              integration_persistence=integration_presistence,
                              lead_persistence=lead_presistence,
                              audience_persistence=audience_persistence,
                              lead_orders_persistence=lead_orders_persistence,
                              integrations_user_sync_persistence=integrations_user_sync_persistence,
                              aws_service=aws_service,
                              domain_persistence=domain_persistence, user_persistence=user_persistence,
                              suppression_persistence=suppression_persitence, epi_persistence=epi_persistence,
                              million_verifier_integrations=million_verifier_integrations
                              )


def get_partners_service(
        partners_persistence: PartnersPersistence = Depends(get_partners_persistence),
        user_persistence: UserPersistence = Depends(get_user_persistence_service),
        send_grid_persistence: SendgridPersistence = Depends(get_send_grid_persistence_service),
        plans_persistence: PlansPersistence = Depends(get_plans_persistence)):
    return PartnersService(
        partners_persistence=partners_persistence,
        user_persistence=user_persistence,
        send_grid_persistence=send_grid_persistence,
        plans_persistence=plans_persistence,
    )


def get_users_auth_service(db: Session = Depends(get_db),
                           payments_plans: PaymentsPlans = Depends(get_payments_plans_service),
                           user_persistence_service: UserPersistence = Depends(get_user_persistence_service),
                           send_grid_persistence_service: SendgridPersistence = Depends(
                               get_send_grid_persistence_service),
                           plans_persistence: PlansPersistence = Depends(
                               get_plans_persistence),
                           integration_service: IntegrationService = Depends(
                               get_integration_service),
                           domain_persistence=Depends(get_user_domain_persistence),
                           referral_persistence_service: ReferralDiscountCodesPersistence = Depends(
                               get_referral_discount_codes_persistence),
                           subscription_service: SubscriptionService = Depends(get_subscription_service),
                           partners_service: PartnersService = Depends(
                               get_partners_service)):
    return UsersAuth(db=db, payments_service=payments_plans, user_persistence_service=user_persistence_service,
                     send_grid_persistence_service=send_grid_persistence_service,
                     subscription_service=subscription_service,
                     plans_persistence=plans_persistence, integration_service=integration_service,
                     partners_service=partners_service,
                     domain_persistence=domain_persistence, referral_persistence_service=referral_persistence_service
                     )


def get_admin_customers_service(db: Session = Depends(get_db),
                                subscription_service: SubscriptionService = Depends(get_subscription_service),
                                user_persistence: UserPersistence = Depends(get_user_persistence_service),
                                users_auth_service: UsersAuth = Depends(get_users_auth_service),
                                plans_presistence: PlansPersistence = Depends(get_plans_persistence),
                                send_grid_persistence: SendgridPersistence = Depends(get_settings_persistence),
                                partners_persistence: PartnersPersistence = Depends(get_partners_persistence)):
    return AdminCustomersService(db=db, subscription_service=subscription_service,
                                 user_persistence=user_persistence, plans_persistence=plans_presistence,
                                 send_grid_persistence=send_grid_persistence,
                                 users_auth_service=users_auth_service, partners_persistence=partners_persistence)


def get_user_authorization_status(user, users_auth_service: UsersAuth):
    status = users_auth_service.get_user_authorization_status_without_pixel(user)
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


def check_user_authorization(Authorization: Annotated[str, Header()],
                             user_persistence_service: UserPersistence = Depends(
                                 get_user_persistence_service), users_auth_service: UsersAuth = Depends(
            get_users_auth_service)) -> Token:
    user = check_user_authentication(Authorization, user_persistence_service)
    auth_status = get_user_authorization_status(user, users_auth_service)
    if auth_status == UserAuthorizationStatus.PAYMENT_NEEDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={'status': auth_status.value,
                    'stripe_payment_url': get_stripe_payment_url(user.get('customer_id'),
                                                                 user.get('stripe_payment_url'))}
        )
    if auth_status != UserAuthorizationStatus.SUCCESS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={'status': auth_status.value}
        )
    return user


def check_user_authorization_without_pixel(Authorization: Annotated[str, Header()],
                                           user_persistence_service: UserPersistence = Depends(
                                               get_user_persistence_service),
                                           users_auth_service: UsersAuth = Depends(
                                               get_users_auth_service)) -> Token:
    user = check_user_authentication(Authorization, user_persistence_service)
    auth_status = get_user_authorization_status(user, users_auth_service)
    if auth_status == UserAuthorizationStatus.PAYMENT_NEEDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={'status': auth_status.value,
                    'stripe_payment_url': get_stripe_payment_url(user.get('customer_id'),
                                                                 user.get('stripe_payment_url'))}
        )
    if auth_status != UserAuthorizationStatus.SUCCESS and auth_status != UserAuthorizationStatus.PIXEL_INSTALLATION_NEEDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={'status': auth_status.value}
        )
    return user


def check_user_setting_access(Authorization: Annotated[str, Header()],
                              user_persistence_service: UserPersistence = Depends(
                                  get_user_persistence_service),
                              users_auth_service: UsersAuth = Depends(
                                  get_users_auth_service)) -> Token:
    user = check_user_authentication(Authorization, user_persistence_service)
    auth_status = get_user_authorization_status(user, users_auth_service)
    if auth_status != UserAuthorizationStatus.SUCCESS and auth_status != UserAuthorizationStatus.NEED_CHOOSE_PLAN and auth_status != UserAuthorizationStatus.PIXEL_INSTALLATION_NEEDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={'status': auth_status.value}
        )
    return user


def check_user_partner(Authorization: Annotated[str, Header()],
                       user_persistence_service: UserPersistence = Depends(
                           get_user_persistence_service)) -> Token:
    user = check_user_authentication(Authorization, user_persistence_service)
    if not user['is_partner']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={'status': 'Aссess Forbidden'}
        )
    return user


def check_team_access_standard_user(user: dict = Depends(check_user_authentication)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
            TeamAccessLevel.STANDARD.value
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    return user


def get_users_service(user=Depends(check_user_authentication),
                      user_persistence: UserPersistence = Depends(get_user_persistence_service),
                      plan_persistence: PlansPersistence = Depends(get_plans_persistence),
                      subscription_service: SubscriptionService = Depends(get_subscription_service),
                      domain_persistence: UserDomainsPersistence = Depends(get_user_domain_persistence),
                      leads_persistence: LeadsPersistence = Depends(get_lead_orders_persistence)
                      ):
    return UsersService(user=user, user_persistence_service=user_persistence, plan_persistence=plan_persistence,
                        subscription_service=subscription_service, domain_persistence=domain_persistence,
                        leads_persistence=leads_persistence)


def get_notification_service(notification_persistence: NotificationPersistence = Depends(get_notification_persistence),
                             subscription_service: SubscriptionService = Depends(get_subscription_service),
                             leads_persistence: LeadsPersistence = Depends(get_leads_persistence),
                             plan_persistence: PlansPersistence = Depends(get_plans_persistence)
                             ):
    return Notification(notification_persistence=notification_persistence, subscription_service=subscription_service,
                        plan_persistence=plan_persistence, leads_persistence=leads_persistence)


def get_domain_service(user_domain_persistence: UserDomainsPersistence = Depends(get_user_domain_persistence),
                       plan_persistence: PlansPersistence = Depends(get_plans_persistence),
                       subscription_service: SubscriptionService = Depends(get_subscription_service)):
    return UserDomainsService(user_domain_persistence=user_domain_persistence, plan_persistence=plan_persistence,
                              subscription_service=subscription_service)


def get_leads_service(user=Depends(check_user_authorization),
                      domain: UserDomains = Depends(check_pixel_install_domain),
                      leads_persistence_service: LeadsPersistence = Depends(get_leads_persistence)):
    return LeadsService(domain=domain, leads_persistence_service=leads_persistence_service)


def get_companies_service(domain: UserDomains = Depends(check_pixel_install_domain),
                          companies_persistence_service: CompanyPersistence = Depends(get_company_persistence)):
    return CompanyService(domain=domain, company_persistence_service=companies_persistence_service)


def get_audience_service(audience_persistence_service: AudiencePersistence = Depends(get_audience_persistence)):
    return AudienceService(audience_persistence_service=audience_persistence_service)


def get_sse_events_service(user_persistence_service: UserPersistence = Depends(get_user_persistence_service)):
    return SseEventsService(user_persistence_service=user_persistence_service)


def get_dashboard_service(domain: UserDomains = Depends(check_pixel_install_domain),
                          user_persistence: UserPersistence = Depends(get_user_persistence_service),
                          leads_persistence_service: LeadsPersistence = Depends(get_leads_persistence)):
    return DashboardService(domain=domain, user_persistence=user_persistence,
                            leads_persistence_service=leads_persistence_service)


def get_audience_dashboard_service(dashboard_audience_persistence:
                                   DashboardAudiencePersistence = Depends(get_dashboard_audience_persistence)
                                   ):
    return DashboardAudienceService(dashboard_audience_persistence=dashboard_audience_persistence)


def get_audience_insights_service(audience_insights_persistence:
                                  AudienceInsightsPersistence = Depends(get_audience_insights_persistence)
                                  ):
    return AudienceInsightsService(insights_persistence_service=audience_insights_persistence)


def get_payouts_service(
        referral_payouts_persistence: ReferralPayoutsPersistence = Depends(get_referral_payouts_persistence),
        referral_user_persistence: ReferralUserPersistence = Depends(get_referral_user_persistence),
        partners_persistence: PartnersPersistence = Depends(get_partners_persistence),
        stripe_service: StripeService = Depends(get_stripe_service)):
    return PayoutsService(referral_payouts_persistence=referral_payouts_persistence,
                          referral_user_persistence=referral_user_persistence,
                          partners_persistence=partners_persistence, stripe_service=stripe_service)


def get_pixel_installation_service(db: Session = Depends(get_db),
                                   send_grid_persistence_service: SendgridPersistence = Depends(
                                       get_send_grid_persistence_service)
                                   ):
    return PixelInstallationService(db=db, send_grid_persistence_service=send_grid_persistence_service)


def get_settings_service(settings_persistence: SettingsPersistence = Depends(
    get_settings_persistence),
        plan_persistence: PlansPersistence = Depends(
            get_plans_persistence
        ),
        user_persistence: UserPersistence = Depends(
            get_user_persistence_service
        ),
        send_grid_persistence: SendgridPersistence = Depends(
            get_send_grid_persistence_service
        )
        ,
        subscription_service: SubscriptionService = Depends(
            get_subscription_service
        ),
        user_domains_service: UserDomainsService = Depends(get_domain_service),
        lead_persistence: LeadsPersistence = Depends(get_leads_persistence)
):
    return SettingsService(settings_persistence=settings_persistence, plan_persistence=plan_persistence,
                           user_persistence=user_persistence,
                           send_grid_persistence=send_grid_persistence, subscription_service=subscription_service,
                           user_domains_service=user_domains_service, lead_persistence=lead_persistence
                           )


def get_suppression_service(suppression_persistence: SuppressionPersistence = Depends(get_suppression_persistence)):
    return SuppressionService(suppression_persistence=suppression_persistence)


def get_plans_service(plans_persistence: PlansPersistence = Depends(get_plans_persistence),
                      subscription_service: SubscriptionService = Depends(get_subscription_service)):
    return PlansService(plans_persistence=plans_persistence, subscription_service=subscription_service)


def get_webhook(subscription_service: SubscriptionService = Depends(get_subscription_service),
                notification_persistence: NotificationPersistence = Depends(get_notification_persistence),
                integration_service: IntegrationService = Depends(get_integration_service)):
    return WebhookService(subscription_service=subscription_service, notification_persistence=notification_persistence,
                          integration_service=integration_service)


def get_payments_service(plans_service: PlansService = Depends(get_plans_service),
                         plan_persistence: PlansPersistence = Depends(get_plans_persistence),
                         integration_service: IntegrationService = Depends(get_integration_service),
                         subscription_service: SubscriptionService = Depends(get_subscription_service),
                         referral_discount_codes_persistence: ReferralDiscountCodesPersistence = Depends(
                             get_referral_discount_codes_persistence)):
    return PaymentsService(plans_service=plans_service, plan_persistence=plan_persistence,
                           subscription_service=subscription_service, integration_service=integration_service,
                           referral_discount_codes_persistence=referral_discount_codes_persistence)


def get_company_info_service(db: Session = Depends(get_db), user=Depends(check_user_authentication),
                             subscription_service: SubscriptionService = Depends(get_subscription_service),
                             partners_persistence: PartnersPersistence = Depends(get_partners_persistence)):
    return CompanyInfoService(db=db, user=user, subscription_service=subscription_service,
                              partners_persistence=partners_persistence)


def get_users_email_verification_service(user=Depends(check_user_authentication),
                                         user_persistence_service: UserPersistence = Depends(
                                             get_user_persistence_service),
                                         sendgrid_persistence_service: SendgridPersistence = Depends(
                                             get_send_grid_persistence_service)):
    return UsersEmailVerificationService(user=user, user_persistence_service=user_persistence_service,
                                         send_grid_persistence_service=sendgrid_persistence_service)


def check_user_admin(Authorization: Annotated[str, Header()],
                     user_persistence_service: UserPersistence = Depends(get_user_persistence_service),
                     ) -> Token:
    user = check_user_authentication(Authorization, user_persistence_service)
    if 'admin' not in user['role']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={'status': 'FORBIDDEN'})
    return user


def check_api_key(maximiz_api_key=Header(None),
                  domain_persistence: UserDomainsPersistence = Depends(get_user_domain_persistence)):
    if maximiz_api_key:
        domains = domain_persistence.get_domain_by_filter(api_key=maximiz_api_key)
        if domains:
            return domains[0]
        raise HTTPException(status_code=404, detail={'status': DomainStatus.DOMAIN_NOT_FOUND.value})
    raise HTTPException(status_code=401, detail={'status': UserAuthorizationStatus.INVALID_API_KEY.value})


def get_lookalikes_service(
        lookalikes_persistence_service: AudienceLookalikesPersistence = Depends(get_lookalikes_persistence)):
    return AudienceLookalikesService(lookalikes_persistence_service=lookalikes_persistence_service)

def get_audience_data_normalization():
    return AudienceDataNormalizationService()

def get_similar_audience_service(
        audience_data_normalization_service: AudienceDataNormalizationService = Depends(get_audience_data_normalization)
):
    return SimilarAudienceService(audience_data_normalization_service=audience_data_normalization_service)