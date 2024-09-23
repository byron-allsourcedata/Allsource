from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from models.users_domains import UserDomains
from models.plans import SubscriptionPlan
from models.users import Users
from models.subscriptions import UserSubscriptions
from models.teams_invitations import TeamsInvitations
import logging

logger = logging.getLogger(__name__)


class UserPersistence:
    def __init__(self, db: Session):
        self.db = db

    def set_reset_password_sent_now(self, user_id: int):
        send_message_expiration_time = datetime.now()
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.reset_password_sent_at: send_message_expiration_time},
            synchronize_session=False)
        self.db.commit()

    def set_verified_email_sent_now(self, user_id: int):
        send_message_expiration_time = datetime.now()
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.verified_email_sent_at: send_message_expiration_time},
            synchronize_session=False)
        self.db.commit()

    def get_user_plan(self, user_id: int):
        user_plan = self.db.query(
            UserSubscriptions.is_trial,
            UserSubscriptions.plan_end
        ).filter(
            UserSubscriptions.user_id == user_id,
        ).first()
        if user_plan:
            return {
                "is_trial": user_plan.is_trial,
                "plan_end": user_plan.plan_end
            }
        else:
            return {
                "is_trial": False,
                "plan_end": None
            }

    def get_user_by_email(self, email):
        user_object = self.db.query(Users).filter(func.lower(Users.email) == func.lower(email)).first()
        return user_object

    def get_user_by_id(self, user_id):
        user = self.db.query(Users).filter(Users.id == user_id).first()
        result_user = None
        if user:
            result_user = {
                "id": user.id,
                "email": user.email,
                "password": user.password,
                "is_email_confirmed": user.is_email_confirmed,
                "is_with_card": user.is_with_card,
                "is_company_details_filled": user.is_company_details_filled,
                "full_name": user.full_name,
                "team_owner_id": user.team_owner_id,
                "image": user.image,
                "company_name": user.company_name,
                "company_website": user.company_website,
                "company_email_address": user.company_email_address,
                "employees_workers": user.employees_workers,
                "created_at": user.created_at,
                "last_login": user.last_login,
                "payment_status": user.payment_status,
                "customer_id": user.customer_id,
                "reset_password_sent_at": user.reset_password_sent_at,
                'pixel_code_sent_at': user.pixel_code_sent_at,
                "verified_email_sent_at": user.verified_email_sent_at,
                "is_book_call_passed": user.is_book_call_passed,
                "stripe_payment_url": user.stripe_payment_url,
                'role': user.role,
                'calendly_uuid': user.calendly_uuid,
                'calendly_invitee_uuid': user.calendly_invitee_uuid,
                'activate_steps_percent': user.activate_steps_percent,
                'leads_credits': user.leads_credits,
                'prospect_credits': user.prospect_credits,
                'is_leads_auto_charging': user.is_leads_auto_charging
            }
        self.db.rollback()
        return result_user
    
    def get_user_team_member_by_id(self, user_id):
        user = self.db.query(Users).filter(Users.id == user_id).first()
        result_user = None
        if user:
            result_user = {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
               'team_access_level': user.team_access_level
            }
        self.db.rollback()
        return result_user

    def update_teams_owner_id(self, user_id, mail, teams_owner_mail):
        teams_owner_id = self.db.query(Users.id).where(Users.email == teams_owner_mail).scalar()
        self.db.query(Users).filter(Users.id == user_id).update({Users.team_owner_id: teams_owner_id},
                                                                  synchronize_session=False)
        
        self.db.query(TeamsInvitations).filter(
            TeamsInvitations.mail == mail,
            TeamsInvitations.teams_owner_id == teams_owner_id
        ).delete()
        self.db.commit()
        return teams_owner_id

    def email_confirmed(self, user_id: int):
        query = self.db.query(Users).filter(Users.id == user_id)
        if query:
            self.db.query(Users).filter(Users.id == user_id).update({"is_email_confirmed": True})
            self.db.commit()

    def update_password(self, user_id: int, password: str):
        self.db.query(Users).filter(Users.id == user_id).update({Users.password: password},
                                                                synchronize_session=False)
        self.db.commit()

    def update_calendly_uuid(self, user_id: int, uuid: str, invitees: str):
        self.db.query(Users).filter(Users.id == user_id).update(
            {
                Users.calendly_uuid: uuid,
                Users.calendly_invitee_uuid: invitees
            },
            synchronize_session=False
        )
        self.db.commit()

    def get_users(self):
        return self.db.query(Users).all()
