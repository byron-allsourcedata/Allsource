import math
from sqlalchemy.orm import Session

from models.audience import Audience
from models.audience_leads import AudienceLeads
from models.leads import Lead
from models.leads_users import LeadUser
from models.plans import SubscriptionPlan, UserSubscriptionPlan


class AudiencePersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_user_audience(self, user_id, page: int, per_page: int):
        query = (
            self.db.query(Lead)
            .join(AudienceLeads, Lead.id == AudienceLeads.lead_id)
            .join(Audience, Audience.id == AudienceLeads.audience_id)
            .filter(Audience.user_id == user_id)
        )
        offset = (page - 1) * per_page
        audience = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page) if per_page > 0 else 1
        return audience, count, max_page

    def post_user_audience(self, user_id, leads_ids, audience_name):
        lead_users = (
            self.db.query(LeadUser)
            .filter(LeadUser.user_id == user_id, LeadUser.lead_id.in_(leads_ids))
            .all()
        )
        if lead_users:
            audience = Audience(name=audience_name, user_id=user_id, type='leads')
            self.db.add(audience)
            self.db.commit()
            for lead_user in lead_users:
                audience_lead = AudienceLeads(audience_id=audience.id, lead_id=lead_user.lead_id)
                self.db.add(audience_lead)

            self.db.commit()
            return audience.id
        else:
            return None
