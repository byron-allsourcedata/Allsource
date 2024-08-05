import logging
import math
from datetime import datetime, timedelta

import pytz
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from models.lead_visits import LeadVisits
from models.leads import Lead
from models.leads_locations import LeadsLocations
from models.leads_users import LeadUser
from models.locations import Locations

logger = logging.getLogger(__name__)


class LeadsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_user_leads(self, user_id, page: int, per_page: int, status, from_date=None, to_date=None, regions=None,
                       page_visits=None,
                       average_time_spent=None, lead_funnel=None, emails=None, recurring_visits=None):
        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
            if start_date == end_date:
                end_date += timedelta(days=1)
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
                LeadUser.status,
                LeadUser.funnel,
                Locations.state,
                Locations.city,
                subquery.c.last_visited_at
            )
            .join(LeadUser, Lead.id == LeadUser.lead_id)
            .join(LeadsLocations, Lead.id == LeadsLocations.lead_id)
            .join(Locations, LeadsLocations.location_id == Locations.id)
            .outerjoin(subquery, LeadUser.id == subquery.c.leads_users_id)
            .filter(LeadUser.user_id == user_id)
        )
        if from_date and to_date:
            query = query.filter(
                and_(
                    subquery.c.last_visited_at >= start_date,
                    subquery.c.last_visited_at <= end_date
                )
            )
        if regions:
            query = query.filter(
                Locations.city.in_(regions)
            )
        if emails:
            email_filters = [Lead.business_email.like(f"%{email}") for email in emails]
            query = query.filter(or_(*email_filters))

        if status == 'new_customers':
            query = query.filter(LeadUser.status == 'New')
        elif status == 'existing_customers':
            query = query.filter(LeadUser.status == 'Existing')

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
