import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from schemas.users import UpdateUserRequest
from enums import UserAuthorizationStatus, UpdateUserStatus
from models.plans import SubscriptionPlan
from models.subscriptions import UserSubscriptions
from models.users import Users
from persistence.plans_persistence import PlansPersistence
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.user_persistence import UserPersistence
from services.subscriptions import SubscriptionService
from services.users_auth import UsersAuth
from utils import get_utc_aware_date

logger = logging.getLogger(__name__)


class AdminCustomersService:

    def __init__(self, db: Session, subscription_service: SubscriptionService, user_persistence: UserPersistence,
                 plans_persistence: PlansPersistence, users_auth_service: UsersAuth, send_grid_persistence: SendgridPersistence):
        self.db = db
        self.subscription_service = subscription_service
        self.user_persistence = user_persistence
        self.plans_persistence = plans_persistence
        self.users_auth_service = users_auth_service
        self.send_grid_persistence = send_grid_persistence

    def get_users(self):
        users_object = self.user_persistence.get_not_partner_users()
        result = []
        for user in users_object:

            payment_status = self.users_auth_service.get_user_authorization_status_without_pixel(user)
            if payment_status == UserAuthorizationStatus.SUCCESS:
                user_plan = self.db.query(
                    UserSubscriptions.is_trial,
                    UserSubscriptions.plan_end
                ).filter(
                    UserSubscriptions.user_id == user.get('id'),
                    UserSubscriptions.status.in_(('active', 'canceled'))
                ).order_by(
                    UserSubscriptions.status,
                    UserSubscriptions.plan_end.desc()
                ).first()
                if user_plan:
                    if user_plan.is_trial:
                        payment_status = 'TRIAL_ACTIVE'
                    else:
                        payment_status = 'SUBSCRIPTION_ACTIVE'
                
            result.append({
                "id": user.get('id'),
                "email": user.get('email'),
                "full_name": user.get('full_name'),
                "created_at": user.get('created_at'),
                'payment_status': payment_status,
                "is_trial": self.plans_persistence.get_trial_status_by_user_id(user.get('id'))
            })
        return result

    def get_user_by_email(self, email):
        user_object = self.db.query(Users).filter(func.lower(Users.email) == func.lower(email)).first()
        return user_object
    
    def create_subscription_for_partner(self, user: Users):
        if not user.current_subscription_id:
                    self.subscription_service.create_subscription_from_partners(user_id=user.id)
        else:
            user_subscription = self.subscription_service.get_user_subscription(user_id=user.id)
            if user_subscription.plan_end.replace(tzinfo=timezone.utc) < get_utc_aware_date() or user_subscription.is_trial:
                self.subscription_service.create_subscription_from_partners(user_id=user.id)

    def update_user(self, update_data: UpdateUserRequest):
        user = self.db.query(Users).filter(Users.id == update_data.user_id).first()
        if not user:
            return UpdateUserStatus.USER_NOT_FOUND
        
        if update_data.is_partner:
            if update_data.is_partner == True:
                self.create_subscription_for_partner(user=user)
                    
            user.is_partner = update_data.is_partner
            self.db.commit()
        
        return UpdateUserStatus.SUCCESS

    def get_user_subscription(self, user_id):
        user_subscription = self.db.query(UserSubscriptions).filter(UserSubscriptions.user_id == user_id).first()
        return user_subscription

    def get_free_trial_plan(self):
        free_trial_plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_free_trial == True).first()
        return free_trial_plan

    def get_default_plan(self):
        default_plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_default == True).first()
        return default_plan

    def set_user_subscription(self, user_id, plan_start, plan_end):
        (
            self.db.query(UserSubscriptions)
            .filter(Users.id == user_id)
            .update(
                {UserSubscriptions.plan_start: plan_start, UserSubscriptions.plan_end: plan_end},
                synchronize_session=False,
            )
        )
        self.db.commit()

    def confirmation_customer(self, email, free_trial=None):
        user_data = self.get_user_by_email(email)
        if free_trial:
            self.subscription_service.create_subscription_from_free_trial(user_id=user_data.id)
        else:
            self.subscription_service.remove_trial(user_data.id)
        
        return user_data


    def set_pixel_installed(self, mail, user_id):
        (
            self.db.query(Users)
            .filter(Users.email == mail)
            .update(
                {Users.is_pixel_installed: True},
                synchronize_session=False,
            )
        )
        self.db.query(Users).filter(Users.id == user_id).update({Users.activate_steps_percent: 90},
                                                              synchronize_session=False)
        self.db.commit()

    def pixel_code_passed(self, mail):
        user_data = self.get_user_by_email(mail)
        if user_data:
            if not user_data.is_pixel_installed:
                self.set_pixel_installed(mail, user_data.id)
                user_subscription = self.get_user_subscription(user_data.id)
                if not user_subscription.plan_start and not user_subscription.plan_end:
                    free_trial_plan = self.get_free_trial_plan()
                    start_date = datetime.utcnow()
                    end_date = start_date + timedelta(days=free_trial_plan.trial_days)
                    start_date_str = start_date.isoformat() + "Z"
                    end_date_str = end_date.isoformat() + "Z"
                    self.set_user_subscription(user_data.id, start_date_str, end_date_str)
        return user_data

