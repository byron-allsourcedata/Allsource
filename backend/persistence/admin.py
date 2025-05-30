from datetime import datetime, timezone

from enums import SignUpStatus
from models import AdminInvitation
from models.five_x_five_users import FiveXFiveUser
from models.users_domains import UserDomains
from models.leads_users import LeadUser
from models.users import Users
from models.leads_users_added_to_cart import LeadsUsersAddedToCart
from models.leads_users_ordered import LeadsUsersOrdered
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, case, and_, or_, distinct
from fastapi import HTTPException
import re


class AdminPersistence:

    def __init__(self, db: Session):
        self.db = db

    def get_domains_by_user(self, user_id: int, domain_substr: str = None):
        query = self.db.query(UserDomains).filter_by(user_id=user_id)
        if domain_substr:
            query = query.filter(UserDomains.domain == domain_substr)
        return query.all()

    def save_pending_invitations_admin(
            self,
            email: str,
            invited_by_id: int,
            full_name: str,
            md5_hash: str,
    ):
        existing_invitation = self.db.query(AdminInvitation).filter(
            AdminInvitation.email == email
        ).first()

        if existing_invitation:
            self.db.delete(existing_invitation)
            self.db.flush()

        new_invitation = AdminInvitation(
            email=email,
            invited_by_id=invited_by_id,
            full_name=full_name,
            token=md5_hash
        )
        self.db.add(new_invitation)
        self.db.commit()

    def check_status_invitations(self, admin_token, user_mail):
        result = {
            'success': True
        }
        teams_invitation = self.db.query(AdminInvitation).filter(AdminInvitation.token == admin_token).first()
        if teams_invitation:
            if teams_invitation.email != user_mail:
                result['success'] = False
                result['error'] = SignUpStatus.NOT_VALID_EMAIL
        else:
            result['success'] = False
            result['error'] = SignUpStatus.TEAM_INVITATION_INVALID
        return result

    def update_admin_user(self, user_id: int, admin_token: str):
        admin_invitation = self.db.query(AdminInvitation).filter(
            AdminInvitation.token == admin_token
        ).first()
        user_data = self.db.query(Users).filter(Users.id == user_id).first()
        user_data.is_email_confirmed = True
        user_data.role = ["admin"]
        user_data.invited_by_id = admin_invitation.invited_by_id
        user_data.added_on = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.flush()
        self.db.delete(admin_invitation)
        self.db.commit()

    def get_pending_invitation_by_email(self, email: str):
        return  self.db.query(AdminInvitation).filter(AdminInvitation.email == email).first()

    def get_pending_invitations_admin(self):
        Inviter = aliased(Users)
        return (
            self.db.query(
                AdminInvitation.id,
                AdminInvitation.email,
                AdminInvitation.full_name,
                AdminInvitation.date_invited_at,
                Inviter.email.label("invited_by_email"),
                AdminInvitation.invited_by_id
            )
            .outerjoin(Inviter, AdminInvitation.invited_by_id == Inviter.id)
            .limit(100)
            .all()
        )
