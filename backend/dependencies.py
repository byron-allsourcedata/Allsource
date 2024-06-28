from backend.config.database import SessionLocal
from contextlib import contextmanager
from sqlalchemy.orm import Session
from fastapi import Depends

from backend.services.payments_plans import PaymentsPlans
from backend.services.subscriptions import SubscriptionService
from backend.services.user_auth_service import UserAuthService
from backend.services.user_persistence_service import UserPersistenceService


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_user_persistence_service(db: Session = Depends(get_db)):
    return UserPersistenceService(db=db)


def get_subscription_service(db: Session = Depends(get_db),
                             user_persistence_service: UserPersistenceService = Depends(get_user_persistence_service)):
    return SubscriptionService(db=db, user_persistence_service=user_persistence_service)


def get_plans_service(db: Session = Depends(get_db),
                      subscription_service: SubscriptionService = Depends(get_subscription_service),
                      user_persistence_service: UserPersistenceService = Depends(get_user_persistence_service)):
    return PaymentsPlans(db=db, subscription_service=subscription_service,
                         user_persistence_service=user_persistence_service)


def get_user_service(db: Session = Depends(get_db), payments_plans: PaymentsPlans = Depends(get_plans_service),
                     user_persistence_service: UserPersistenceService = Depends(get_user_persistence_service)):
    return UserAuthService(db=db, plans_service=payments_plans, user_persistence_service=user_persistence_service)
