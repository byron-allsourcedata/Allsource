import logging

from datetime import datetime

from jose import jwt, JWTError

from config.auth import AuthConfig
from config.database import SessionLocal
from sqlalchemy.orm import Session
from typing_extensions import Annotated
from fastapi import Depends, Header, HTTPException, status

from enums import UserAuthorizationStatus
from exceptions import InvalidToken
from persistence.audience_persistence import AudiencePersistence
from persistence.leads_persistence import LeadsPersistence
from persistence.plans_persistence import PlansPersistence
from schemas.auth_token import Token
from services.admin_customers import AdminCustomersService
from services.company_info import CompanyInfoService
from services.dashboard import DashboardService
from services.leads import LeadsService
from services.payments import PaymentsService
from services.payments_plans import PaymentsPlans
from persistence.sendgrid_persistence import SendgridPersistence
from services.plans import PlansService
from services.subscriptions import SubscriptionService
from services.users_email_verification import UsersEmailVerificationService
from services.users import UsersService
from services.sse_events import SseEventsService
from services.pixel_installation import PixelInstallationService
from models.users import Users as User
from services.users_auth import UsersAuth
from persistence.user_persistence import UserPersistence
from services.webhook import WebhookService

logger = logging.getLogger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_plans_persistence(db: Session = Depends(get_db)):
    return PlansPersistence(db=db)


def get_leads_persistence(db: Session = Depends(get_db)):
    return LeadsPersistence(db=db)


def get_send_grid_persistence_service(db: Session = Depends(get_db)):
    return SendgridPersistence(db=db)


def get_user_persistence_service(db: Session = Depends(get_db)):
    return UserPersistence(db=db)


def get_audience_persistence(db: Session = Depends(get_db)):
    return UserPersistence(db=db)


def get_subscription_service(db: Session = Depends(get_db),
                             user_persistence_service: UserPersistence = Depends(get_user_persistence_service)):
    return SubscriptionService(db=db, user_persistence_service=user_persistence_service)


def get_admin_customers_service(db: Session = Depends(get_db),
                                subscription_service: SubscriptionService = Depends(get_subscription_service)):
    return AdminCustomersService(db=db, subscription_service=subscription_service)


def get_user_authorization_status_without_pixel(user: User, subscription_service):
    if user.is_with_card:
        if user.company_name:
            subscription_plan_is_active = subscription_service.is_user_has_active_subscription(user.id)
            if subscription_plan_is_active:
                return UserAuthorizationStatus.SUCCESS
            else:
                return UserAuthorizationStatus.NEED_CHOOSE_PLAN
        else:
            return UserAuthorizationStatus.FILL_COMPANY_DETAILS
    else:
        if user.is_email_confirmed:
            if user.company_name:
                if user.is_book_call_passed:
                    subscription_plan_is_active = subscription_service.is_user_has_active_subscription(user.id)
                    if subscription_plan_is_active:
                        return UserAuthorizationStatus.SUCCESS
                    else:
                        if user.stripe_payment_url:
                            return UserAuthorizationStatus.PAYMENT_NEEDED
                        else:
                            return UserAuthorizationStatus.NEED_CHOOSE_PLAN
                else:
                    return UserAuthorizationStatus.NEED_BOOK_CALL
            else:
                return UserAuthorizationStatus.FILL_COMPANY_DETAILS
    return UserAuthorizationStatus.NEED_CONFIRM_EMAIL


def get_user_authorization_status(user: User, subscription_service):
    status = get_user_authorization_status_without_pixel(user, subscription_service)
    if status == UserAuthorizationStatus.SUCCESS and not user.is_pixel_installed:
        return UserAuthorizationStatus.PIXEL_INSTALLATION_NEEDED
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
                                 get_user_persistence_service), subscription_service: SubscriptionService = Depends(
            get_subscription_service)) -> Token:
    user = check_user_authentication(Authorization, user_persistence_service)
    auth_status = get_user_authorization_status(user, subscription_service)
    if auth_status == UserAuthorizationStatus.PAYMENT_NEEDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={'status': auth_status.value,
                    'stripe_payment_url': user.stripe_payment_url}
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
                                           subscription_service: SubscriptionService = Depends(
                                               get_subscription_service)) -> Token:
    user = check_user_authentication(Authorization, user_persistence_service)
    auth_status = get_user_authorization_status(user, subscription_service)
    if auth_status == UserAuthorizationStatus.PAYMENT_NEEDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={'status': auth_status.value,
                    'stripe_payment_url': user.stripe_payment_url}
        )
    if auth_status != UserAuthorizationStatus.SUCCESS and auth_status != UserAuthorizationStatus.PIXEL_INSTALLATION_NEEDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={'status': auth_status.value}
        )
    return user


def check_user_authentication(Authorization: Annotated[str, Header()],
                              user_persistence_service: UserPersistence = Depends(
                                  get_user_persistence_service)) -> Token:
    user_data = parse_jwt_data(Authorization)
    user = user_persistence_service.get_user_by_id(user_data.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                'NOT_FOUND'
            }
        )
    return user


def get_payments_plans_service(db: Session = Depends(get_db),
                               subscription_service: SubscriptionService = Depends(get_subscription_service),
                               user_persistence_service: UserPersistence = Depends(get_user_persistence_service)):
    return PaymentsPlans(db=db, subscription_service=subscription_service,
                         user_persistence_service=user_persistence_service)


def get_users_auth_service(db: Session = Depends(get_db),
                           payments_plans: PaymentsPlans = Depends(get_payments_plans_service),
                           user_persistence_service: UserPersistence = Depends(get_user_persistence_service),
                           send_grid_persistence_service: SendgridPersistence = Depends(
                               get_send_grid_persistence_service),
                           subscription_service: SubscriptionService = Depends(get_subscription_service)):
    return UsersAuth(db=db, payments_service=payments_plans, user_persistence_service=user_persistence_service,
                     send_grid_persistence_service=send_grid_persistence_service,
                     subscription_service=subscription_service)


def get_users_service(user: User = Depends(check_user_authentication),
                      user_persistence_service: UserPersistence = Depends(get_user_persistence_service)):
    return UsersService(user=user, user_persistence_service=user_persistence_service)


def get_leads_service(user: User = Depends(check_user_authorization),
                      leads_persistence_service: LeadsPersistence = Depends(get_leads_persistence)):
    return LeadsService(user=user, leads_persistence_service=leads_persistence_service)


def get_audience_service(user: User = Depends(check_user_authorization),
                         audience_persistence_service: AudiencePersistence = Depends(get_audience_persistence)):
    return LeadsService(user=user, audience_persistence_service=audience_persistence_service)


def get_sse_events_service(user_persistence_service: UserPersistence = Depends(get_user_persistence_service)):
    return SseEventsService(user_persistence_service=user_persistence_service)


def get_dashboard_service(user: User = Depends(check_user_authorization)):
    return DashboardService(user=user)


def get_pixel_installation_service(db: Session = Depends(get_db),
                                   user: User = Depends(check_user_authorization_without_pixel)):
    return PixelInstallationService(db=db, user=user)


def get_plans_service(user: User = Depends(check_user_authentication),
                      plans_persistence: PlansPersistence = Depends(get_plans_persistence),
                      subscription_service: SubscriptionService = Depends(get_subscription_service)):
    return PlansService(plans_persistence=plans_persistence, user=user, subscription_service=subscription_service)


def get_webhook(subscription_service: SubscriptionService = Depends(get_subscription_service)):
    return WebhookService(subscription_service=subscription_service)


def get_payments_service(plans_service: PlansService = Depends(get_plans_service)):
    return PaymentsService(plans_service=plans_service)


def get_company_info_service(db: Session = Depends(get_db), user: User = Depends(check_user_authentication),
                             subscription_service: SubscriptionService = Depends(get_subscription_service)):
    return CompanyInfoService(db=db, user=user, subscription_service=subscription_service)


def get_users_email_verification_service(user: User = Depends(check_user_authentication),
                                         user_persistence_service: UserPersistence = Depends(
                                             get_user_persistence_service),
                                         sendgrid_persistence_service: SendgridPersistence = Depends(
                                             get_send_grid_persistence_service)):
    return UsersEmailVerificationService(user=user, user_persistence_service=user_persistence_service,
                                         send_grid_persistence_service=sendgrid_persistence_service)
