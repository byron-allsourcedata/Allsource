import logging
import math
import io
import csv

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

    def filter_leads(self, user, page, per_page, status, from_date, to_date, regions, page_visits, average_time_spent,
                     lead_funnel, emails, recurring_visits):
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
            .filter(LeadUser.user_id == user.id)
        )
        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
            if start_date == end_date:
                end_date += timedelta(days=1)
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
        return leads, count, max_page

    def get_lead_data(self, lead_id):
        lead = self.db.query(Lead).filter(Lead.id == lead_id).first()
        if lead:
            return lead
        return None

    def get_ids_user_leads_ids(self, user_id, leads_ids):
        lead_users = self.db.query(LeadUser).filter(LeadUser.user_id == user_id,
                                                    LeadUser.lead_id.in_(leads_ids)).all()
        lead_ids_set = {lead_user.lead_id for lead_user in lead_users}
        return lead_ids_set

    def get_full_user_leads_by_ids(self, user_id, leads_ids):
        lead_users = (
            self.db.query(
                Lead.first_name,
                Lead.last_name,
                Lead.gender,
                Lead.mobile_phone,
                Lead.ip,
                Lead.company_name,
                Lead.company_city,
                Lead.company_state,
                Lead.company_zip,
                Lead.business_email,
                Lead.time_spent,
                Lead.no_of_visits,
                Lead.no_of_page_visits,
                Lead.age_min,
                Lead.age_max,
                Lead.company_domain,
                Lead.company_phone,
                Lead.company_sic,
                Lead.company_address,
                Lead.company_revenue,
                Lead.company_employee_count
            )
            .join(LeadUser, LeadUser.lead_id == Lead.id)
            .filter(
                LeadUser.user_id == user_id,
                LeadUser.lead_id.in_(leads_ids)
            )
            .all()
        )
        return lead_users
