from sqlalchemy.orm import Session
import math

from models.leads import Lead
from models.leads_users import LeadUser
from models.users import Users
import logging

logger = logging.getLogger(__name__)


class LeadsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_user_leads(self, user_id, page: int, per_page: int):
        # Join Lead and LeadUser tables
        query = self.db.query(Lead).join(LeadUser, Lead.id == LeadUser.lead_id).filter(LeadUser.user_id == user_id)

        # Calculate the offset
        offset = (page - 1) * per_page

        # Apply limit and offset for pagination
        leads = query.limit(per_page).offset(offset).all()

        # Get total leads count for the user (for pagination)
        count = self.db.query(Lead).join(LeadUser, Lead.id == LeadUser.lead_id).filter(
            LeadUser.user_id == user_id).count()

        max_page = math.ceil(count / per_page)

        return leads, count, max_page
