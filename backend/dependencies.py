import logging

from datetime import datetime

from jose import jwt, JWTError

from config.auth import AuthConfig
from config.database import SessionLocal
from contextlib import contextmanager
from sqlalchemy.orm import Session
from typing_extensions import Annotated
from fastapi import Depends, Header, Request, HTTPException, status, Query

from enums import UserAuthorizationStatus
from exceptions import InvalidToken
from schemas.auth_token import Token
from services.payments_plans import PaymentsPlans
from services.send_grid_persistence import SendGridPersistenceService
from services.subscriptions import SubscriptionService
from services.users_email_verification import UsersEmailVerificationService
from services.users import UsersService
from models.users import Users as User
from services.users_auth import UsersAuth
from services.user_persistence_service import UserPersistenceService


logger = logging.getLogger(__name__)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_send_grid_persistence_service(db: Session = Depends(get_db)):
    return SendGridPersistenceService(db=db)


def get_user_persistence_service(db: Session = Depends(get_db)):
    return UserPersistenceService(db=db)


def check_user_subscription():
    return UserAuthorizationStatus.NEED_CHOOSE_PLAN


def get_user_authorization_status(user: User):
    if user.is_with_card:
        return check_user_subscription()
    else:
        if not user.is_email_confirmed:
            return UserAuthorizationStatus.NEED_CONFIRM_EMAIL
        if not user.is_company_details_filled:
            return UserAuthorizationStatus.FILL_COMPANY_DETAILS
    return UserAuthorizationStatus.SUCCESS


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
                             user_persistence_service: UserPersistenceService = Depends(
                                 get_user_persistence_service)) -> Token:
    user_data = parse_jwt_data(Authorization)
    user = user_persistence_service.get_user_by_id(user_data.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": 'NOT_FOUND'
            }
        )
    auth_status = get_user_authorization_status(user)
    if auth_status != UserAuthorizationStatus.SUCCESS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "status": auth_status
            }
        )
    return user


def check_user_authentication(Authorization: Annotated[str, Header()],
                              user_persistence_service: UserPersistenceService = Depends(
                                  get_user_persistence_service)) -> Token:
    user_data = parse_jwt_data(Authorization)
    user = user_persistence_service.get_user_by_id(user_data.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": 'NOT_FOUND'
            }
        )
    return user


def get_subscription_service(db: Session = Depends(get_db),
                             user_persistence_service: UserPersistenceService = Depends(get_user_persistence_service)):
    return SubscriptionService(db=db, user_persistence_service=user_persistence_service)


def get_plans_service(db: Session = Depends(get_db),
                      subscription_service: SubscriptionService = Depends(get_subscription_service),
                      user_persistence_service: UserPersistenceService = Depends(get_user_persistence_service)):
    return PaymentsPlans(db=db, subscription_service=subscription_service,
                         user_persistence_service=user_persistence_service)


def get_users_auth_service(db: Session = Depends(get_db), payments_plans: PaymentsPlans = Depends(get_plans_service),
                           user_persistence_service: UserPersistenceService = Depends(get_user_persistence_service),
                           send_grid_persistence_service: SendGridPersistenceService = Depends(get_send_grid_persistence_service)):
    return UsersAuth(db=db, plans_service=payments_plans, user_persistence_service=user_persistence_service,
                     send_grid_persistence_service=send_grid_persistence_service)


def get_users_service(user: User = Depends(check_user_authorization),
                      user_persistence_service: UserPersistenceService = Depends(get_user_persistence_service)):
    return UsersService(user=user, user_persistence_service=user_persistence_service)


def get_users_email_verification_service(user: User = Depends(check_user_authentication),
                                         user_persistence_service: UserPersistenceService = Depends(
                                             get_user_persistence_service),
                                         send_grid_persistence_service: SendGridPersistenceService = Depends(
                                             get_send_grid_persistence_service)):
    return UsersEmailVerificationService(user=user, user_persistence_service=user_persistence_service,
                                         send_grid_persistence_service=send_grid_persistence_service)

def request_logger(r: Request):
    payload = r.body() if not r.form() else ""
    if r.client is None:
        log = f"\nclient: WHO:WHERE\n{r.method} {r.url.path}\n{payload}"
    else:
        log = f"\nclient: {r.client.host}:{r.client.port}\n{r.method} {r.url.path}\n{payload}"
    logger.info(log)
