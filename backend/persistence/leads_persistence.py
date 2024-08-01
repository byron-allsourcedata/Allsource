from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import func, desc
import math

from models.leads import Lead
from models.leads_users import LeadUser
from models.leads_locations import LeadsLocations
from models.locations import Locations
from models.lead_visits import LeadVisits
import logging

logger = logging.getLogger(__name__)


class LeadsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_user_leads_by_status(self, user_id, page: int, per_page: int, filter=None):
        lead_user_alias = aliased(LeadUser)
        leads_locations_alias = aliased(LeadsLocations)
        locations_alias = aliased(Locations)

        subquery = (
            self.db.query(
                LeadVisits.leads_users_id,
                func.max(LeadVisits.visited_at).label('last_visited_at')
            )
            .group_by(LeadVisits.leads_users_id)
            .subquery()
        )

        query = (
            self.db.query(
                Lead,
                lead_user_alias.status,
                lead_user_alias.funnel,
                locations_alias.state,
                locations_alias.city,
                subquery.c.last_visited_at
            )
            .join(lead_user_alias, Lead.id == lead_user_alias.lead_id)
            .join(leads_locations_alias, Lead.id == leads_locations_alias.lead_id)
            .join(locations_alias, leads_locations_alias.location_id == locations_alias.id)
            .outerjoin(subquery, lead_user_alias.id == subquery.c.leads_users_id)
            .filter(lead_user_alias.user_id == user_id)
        )
        if filter == 'new_customers':
            query = query.filter(lead_user_alias.status == 'New')
        elif filter == 'existing_customers':
            query = query.filter(lead_user_alias.status == 'Existing')

        offset = (page - 1) * per_page
        leads = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page)

        leads_list = [
            {
                'lead': lead,
                'status': status,
                'funnel': funnel,
                'state': state,
                'city': city,
                'last_visited_date': last_visited_at.strftime('%d.%m.%Y') if last_visited_at else 'N/A',
                'last_visited_time': last_visited_at.strftime('%H:%M') if last_visited_at else 'N/A'
            }
            for lead, status, funnel, state, city, last_visited_at in leads
        ]

        return leads_list, count, max_page
