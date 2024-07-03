import logging

from datetime import datetime

from jose import jwt, JWTError

from backend.config.auth import AuthConfig
from backend.config.database import SessionLocal
from contextlib import contextmanager
from sqlalchemy.orm import Session
from typing_extensions import Annotated
from fastapi import Depends, Header, Request

from backend.exceptions import InvalidToken
from backend.schemas.auth_token import Token
from backend.services.payments_plans import PaymentsPlans
from backend.services.subscriptions import SubscriptionService
from backend.services.users import Users
from backend.models.users import Users as User
from backend.services.users_auth import UsersAuth
from backend.services.user_persistence_service import UserPersistenceService

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def parse_jwt_data(Authorization: Annotated[str, Header()]) -> Token:
    access_token = Authorization.replace("Bearer ", "")
    print(access_token)
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


def get_user_persistence_service(db: Session = Depends(get_db) ):
    return UserPersistenceService(db=db)

def get_subscription_service(db: Session = Depends(get_db),
                             user_persistence_service: UserPersistenceService = Depends(get_user_persistence_service)):
    return SubscriptionService(db=db, user_persistence_service=user_persistence_service)


def get_plans_service(db: Session = Depends(get_db),
                      subscription_service: SubscriptionService = Depends(get_subscription_service),
                      user_persistence_service: UserPersistenceService = Depends(get_user_persistence_service)):
    return PaymentsPlans(db=db, subscription_service=subscription_service,
                         user_persistence_service=user_persistence_service)


def get_users_auth(db: Session = Depends(get_db), payments_plans: PaymentsPlans = Depends(get_plans_service),
                   user_persistence_service: UserPersistenceService = Depends(get_user_persistence_service)):
    return UsersAuth(db=db, plans_service=payments_plans, user_persistence_service=user_persistence_service)


def get_users(user: dict = Depends(parse_jwt_data),
              user_persistence_service: UserPersistenceService = Depends(get_user_persistence_service)):
    return Users(user=user, user_persistence_service=user_persistence_service)


def valid_user(token: str, db) -> User:
    access_token = token.replace("Bearer ", "")
    try:
        data = jwt.decode(
            access_token,
            AuthConfig.secret_key,
            algorithms=["HS256"],
            audience="Filed-Client-Apps",
        )
        if datetime.utcnow() > datetime.fromtimestamp(data["exp"]):
            raise InvalidToken
        data_user = Token(**data)
    except JWTError:
        raise InvalidToken
    user = db.query(User).filter(User.id == data_user.id).first()

    if user:
        return user
    return None


def request_logger(r: Request):
    payload = r.body() if not r.form() else ""
    if r.client is None:
        log = f"\nclient: WHO:WHERE\n{r.method} {r.url.path}\n{payload}"
    else:
        log = f"\nclient: {r.client.host}:{r.client.port}\n{r.method} {r.url.path}\n{payload}"
    logger.info(log)
