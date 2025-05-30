import hashlib
import json
import logging
import os
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session

from persistence.admin import AdminPersistence
from schemas.users import UpdateUserRequest
from enums import UserAuthorizationStatus, UpdateUserStatus, SendgridTemplate, SettingStatus, AdminStatus
from models.plans import SubscriptionPlan
from models.subscriptions import UserSubscriptions
from models.users import Users
from persistence.plans_persistence import PlansPersistence
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.user_persistence import UserPersistence
from persistence.audience_dashboard import DashboardAudiencePersistence
from services.jwt_service import create_access_token
from services.sendgrid import SendgridHandler
from services.subscriptions import SubscriptionService
from services.users_auth import UsersAuth
from utils import get_md5_hash
from utils import get_utc_aware_date
from persistence.partners_persistence import PartnersPersistence

logger = logging.getLogger(__name__)


class AdminCustomersService:

    def __init__(self, db: Session, subscription_service: SubscriptionService, user_persistence: UserPersistence,
                 plans_persistence: PlansPersistence, users_auth_service: UsersAuth, send_grid_persistence: SendgridPersistence,
                 partners_persistence: PartnersPersistence, dashboard_audience_persistence: DashboardAudiencePersistence,
                 admin_persistence: AdminPersistence):
        self.db = db
        self.subscription_service = subscription_service
        self.user_persistence = user_persistence
        self.plans_persistence = plans_persistence
        self.users_auth_service = users_auth_service
        self.send_grid_persistence = send_grid_persistence
        self.partners_persistence = partners_persistence
        self.dashboard_audience_persistence = dashboard_audience_persistence
        self.admin_persistence = admin_persistence

    def get_admin_users(self, page, per_page):
        admin_users, total_count = self.user_persistence.get_admin_users(page, per_page)
        users_dict = [
            dict(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                created_at=user.created_at,
                last_login=user.last_login,
                invited_by_email=user.invited_by_email,
                role=user.role,
            )
            for user in admin_users
        ]
        return {
            'users': users_dict,
            'count': total_count
        }

    def generate_access_token(self, user: dict, user_account_id: int):
        if self.user_persistence.get_user_by_id(user_account_id):
            token_info = {
                "id": user_account_id,
                "requester_access_user_id": user.get('id')
            }
            return create_access_token(token_info)
        return None

    def invite_user(self, user: dict, email: str, name: str):
        exists_team_member = self.user_persistence.get_user_by_email(email=email)
        if exists_team_member:
            return {
                'status': AdminStatus.ALREADY_EXISTS
            }
        template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.ADMIN_INVITATION_TEMPLATE.value)
        if not template_id:
            logger.info("template_id is None")
            return {
                'status': AdminStatus.SENDGRID_TEMPLATE_NOT_FAILED
            }

        md5_token_info = {
            'id': user.get('id'),
            'user_mail': email,
            'salt': os.getenv('SECRET_SALT')
        }
        json_string = json.dumps(md5_token_info, sort_keys=True)
        md5_hash = hashlib.md5(json_string.encode()).hexdigest()
        confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/signup?admin_token={md5_hash}&user_mail={email}"
        mail_object = SendgridHandler()
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=template_id,
            template_placeholder={"full_name": name, "link": confirm_email_url}
        )
        self.admin_persistence.save_pending_invitations_admin(email=email,
                                                              invited_by_id=user.get('id'), md5_hash=md5_hash)
        return {
            'status': AdminStatus.SUCCESS
        }

    def get_customer_users(self, page, per_page):
        users, total_count = self.user_persistence.get_customer_users(page, per_page)
        result = []
        users_dict = [
            dict(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                created_at=user.created_at,
                last_login=user.last_login,
                role=user.role,
                pixel_installed_count=user.pixel_installed_count,
                sources_count=user.sources_count,
                lookalikes_count=user.lookalikes_count,
                credits_count=user.credits_count,
                is_email_confirmed=user.is_email_confirmed,
                is_book_call_passed=user.is_book_call_passed
            )
            for user in users
        ]
        for user in users_dict:
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
                "is_trial": self.plans_persistence.get_trial_status_by_user_id(user.get('id')),
                'last_login': user.get('last_login'),
                'role': user.get('role'),
                'pixel_installed_count': user.get('pixel_installed_count'),
                'sources_count': user.get('sources_count'),
                'lookalikes_count': user.get('lookalikes_count'),
                'credits_count': user.get('credits_count')
            })
        return {
            'users': result,
            'count': total_count
        }

    def get_audience_metrics(self):
        audience_metrics = {}
        dashboard_audience_data = self.dashboard_audience_persistence.get_audience_metrics()

        for result in dashboard_audience_data:
            key = result['key']
            query = result['query']
            count = query.scalar()
            audience_metrics[key] = count or 0

        return {
            "audience_metrics": audience_metrics
        }

    def get_user_by_email(self, email):
            user_object = self.db.query(Users).filter(func.lower(Users.email) == func.lower(email)).first()
            return user_object
    
    def create_subscription_for_partner(self, user: Users):
        if not user.current_subscription_id:
                    self.subscription_service.create_subscription_from_partners(user_id=user.id)
        else:
            user_subscription = self.subscription_service.get_user_subscription(user_id=user.id)
            if user_subscription.is_trial or user_subscription.plan_end.replace(tzinfo=timezone.utc) < get_utc_aware_date():
                self.subscription_service.create_subscription_from_partners(user_id=user.id)

    def update_user(self, update_data: UpdateUserRequest):
        user = self.db.query(Users).filter(Users.id == update_data.user_id).first()
        if not user:
            return UpdateUserStatus.USER_NOT_FOUND
        
        if update_data.is_partner:
            if update_data.is_partner == True:
                self.create_subscription_for_partner(user=user)
                commission = 70 if update_data.commission >= 70 else update_data.commission
                creating_data = {
                    'user_id': user.id,
                    'join_date': datetime.now(timezone.utc),
                    "name": user.full_name,
                    "email": user.email,
                    "company_name": user.company_name,
                    "commission": commission,
                    "token": get_md5_hash(user.email),
                    "is_master": True if update_data.is_master else False,
                    'status': 'signup'
                }
                self.partners_persistence.create_partner(creating_data)
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
    