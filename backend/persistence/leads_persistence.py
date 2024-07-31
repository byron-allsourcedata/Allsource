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

    def get_user_leads(self, user_id, page: int, per_page: int):
        LeadUserAlias = aliased(LeadUser)
        LeadsLocationsAlias = aliased(LeadsLocations)
        LocationsAlias = aliased(Locations)

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
                LeadUserAlias.status,
                LeadUserAlias.funnel,
                LocationsAlias.state,
                LocationsAlias.city,
                subquery.c.last_visited_at
            )
                .join(LeadUserAlias, Lead.id == LeadUserAlias.lead_id)
                .join(LeadsLocationsAlias, Lead.id == LeadsLocationsAlias.lead_id)
                .join(LocationsAlias, LeadsLocationsAlias.location_id == LocationsAlias.id)
                .outerjoin(subquery, LeadUserAlias.id == subquery.c.leads_users_id)
                .filter(LeadUserAlias.user_id == user_id)
        )

        offset = (page - 1) * per_page

        leads = query.limit(per_page).offset(offset).all()

        count = (
            self.db.query(Lead)
                .join(LeadUser, Lead.id == LeadUser.lead_id)
                .filter(LeadUser.user_id == user_id)
                .count()
        )

        max_page = math.ceil(count / per_page)

        leads_list = []
        for lead, status, funnel, state, city, last_visited_at in leads:
            last_visited_date = last_visited_at.strftime('%d.%m.%Y') if last_visited_at else 'N/A'
            last_visited_time = last_visited_at.strftime('%H:%M') if last_visited_at else 'N/A'
            lead_dict = {
                'lead': lead,
                'status': status,
                'funnel': funnel,
                'state': state,
                'city': city,
                'last_visited_date': last_visited_date,
                'last_visited_time': last_visited_time
            }
            leads_list.append(lead_dict)

        return leads_list, count, max_page
