from datetime import datetime, timezone

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
            team_owner_id: int,
            email: str,
            invited_by_id: int,
            md5_hash: str,
    ):
        invitation = AdminInvitation(
            email=email,
            invited_by_id=invited_by_id,
            token=md5_hash
        )
        self.db.add(invitation)
        self.db.commit()
