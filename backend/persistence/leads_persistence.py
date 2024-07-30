from sqlalchemy.orm import Session
from models.leads import Lead
from models.leads_users import LeadUser
from models.users import Users
import logging

logger = logging.getLogger(__name__)


class LeadsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_user_leads(self, user_id, page: int = 1, per_page: int = 15):
        # Join Lead and LeadUser tables
        query = self.db.query(Lead).join(LeadUser, Lead.id == LeadUser.lead_id).filter(LeadUser.user_id == user_id)

        # Calculate the offset
        offset = (page - 1) * per_page

        # Apply limit and offset for pagination
        leads = query.limit(per_page).offset(offset).all()

        # Get total leads count for the user (for pagination)
        count = self.db.query(Lead).join(LeadUser, Lead.id == LeadUser.lead_id).filter(
            LeadUser.user_id == user_id).count()

        return leads, count
