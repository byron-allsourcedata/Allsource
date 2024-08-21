import logging
import math
import io
import csv

from datetime import datetime, timedelta

import pytz
from sqlalchemy import and_, or_, desc, asc, Integer
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import func

from models.audience import Audience
from models.audience_leads import AudienceLeads
from models.lead_visits import LeadVisits
from models.leads import Lead
from models.leads_locations import LeadsLocations
from models.leads_users import LeadUser
from models.locations import Locations

from schemas.integrations import Customer

logger = logging.getLogger(__name__)


class LeadsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def filter_leads(self, user_id, page, per_page, status, from_date, to_date, regions, page_visits, average_time_spent,
                     lead_funnel, emails, recurring_visits, sort_by, sort_order, search_query):
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
        sort_options = {
            'name': Lead.first_name,
            'business_email': Lead.business_email,
            'mobile_phone': Lead.mobile_phone,
            'time_spent': Lead.time_spent,
            'no_of_visits': Lead.no_of_visits,
            'no_of_page_visits': Lead.no_of_page_visits,
            'gender': Lead.gender,
            'last_visited_date': subquery.c.last_visited_at,
            'status': LeadUser.status,
            'funnel': LeadUser.funnel,
            'state': Locations.state,
            'city': Locations.city,
            'age': Lead.age_min
        }
        if sort_by:
            sort_column = sort_options[sort_by]
            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            elif sort_order == 'desc':
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(desc(subquery.c.last_visited_at))
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
            region_list = regions.split(',')
            region_filters = [Locations.city.ilike(f'%{region.strip()}%') for region in region_list]
            query = query.filter(or_(*region_filters))
        if emails:
            email_list = emails.split(',')
            email_filters = [Lead.business_email.ilike(f'%{email.strip()}%') for email in email_list]
            query = query.filter(or_(*email_filters))
        if status == 'new_customers':
            query = query.filter(LeadUser.status == 'New')
        elif status == 'existing_customers':
            query = query.filter(LeadUser.status == 'Existing')

        if lead_funnel:
            funnel_list = lead_funnel.split(',')
            query = query.filter(LeadUser.funnel.in_(funnel_list))

        if page_visits:
            query = query.filter(Lead.no_of_page_visits >= page_visits)

        if average_time_spent:
            query = query.filter(Lead.time_spent >= average_time_spent)

        if search_query:
            search_conditions = or_(
                Lead.first_name.ilike(f'%{search_query}%'),
                Lead.last_name.ilike(f'%{search_query}%'),
                Lead.business_email.ilike(f'%{search_query}%'),
                Lead.mobile_phone.ilike(f'%{search_query}%'),
            )
            query = query.filter(search_conditions)

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
    
    def create_age_conditions(self, age_str: str):
        filters = []
        for part in age_str:
            if '-' in part:
                start, end = map(int, part.split('-'))
                filters.append(and_(Lead.age_min <= end, Lead.age_max >= start))
            else:
                age = int(part)
                filters.append(and_(Lead.age_min <= age, Lead.age_max >= age))
        return filters

    def build_net_worth_filters(self, net_worth_str: str):
        filters = []
        for part in net_worth_str.split(','):
            part = part.strip()
            if '-' in part:
                if '$' in part:
                    part = part.replace('$', '').replace(',', '')
                start, end = map(int, part.split('-'))
                filters.append(and_(
                    func.regexp_replace(Lead.net_worth, r'[\$,]', '', 'g').cast(Integer) >= start,
                    func.regexp_replace(Lead.net_worth, r'[\$,]', '', 'g').cast(Integer) <= end
                ))
            else:
                if '$' in part:
                    part = part.replace('$', '').replace(',', '')
                value = int(part)
                filters.append(and_(
                    func.regexp_replace(Lead.net_worth, r'[\$,]', '', 'g').cast(Integer) >= value,
                    func.regexp_replace(Lead.net_worth, r'[\$,]', '', 'g').cast(Integer) <= value
                ))
        return filters

    def normalize_profession(self, profession: str) -> str:
        return profession.lower().replace(" ", "-")

    def filter_leads_for_build_audience(self, regions, professions, ages, genders, net_worths,
                                        interest_list, not_in_existing_lists, page, per_page):
        query = (
            self.db.query(
                Lead.id,
                Lead.first_name,
                Lead.last_name,
                Lead.business_email,
                Lead.gender,
                Lead.age_min,
                Lead.age_max,
                Lead.job_title,
                Locations.state,
                Locations.city,
            )
            .join(LeadsLocations, LeadsLocations.lead_id == Lead.id)
            .join(Locations, LeadsLocations.location_id == Locations.id)
        )

        if not_in_existing_lists:
            not_in_existing_lists = not_in_existing_lists.split(',')
            audience_leads_alias = aliased(AudienceLeads)
            audience_subquery = (
                self.db.query(audience_leads_alias.lead_id)
                .select_from(audience_leads_alias)
                .join(Audience, audience_leads_alias.lead_id == Audience.id)
                .filter(Audience.name.in_(not_in_existing_lists))
            )
            query = query.filter(Lead.id.notin_(audience_subquery))
        if regions:
            regions = regions.split(',')
            filters = [Locations.city == region.lower() for region in regions]
            query = query.filter(or_(*filters))
        if professions:
            professions = professions.split(',')
            normalized_professions = [self.normalize_profession(p) for p in professions]
            profession_filters = []
            for profession in normalized_professions:
                profession_filters.append(Lead.job_title.ilike(f"%{profession.replace('-', ' ')}%"))

            query = query.filter(or_(*profession_filters))
        if ages:
            ages = ages.split(',')
            age_filters = self.create_age_conditions(ages)
            query = query.filter(or_(*age_filters))
        if genders:
            genders = genders.split(',')
            filters = [Lead.gender == gender.upper() for gender in genders]
            query = query.filter(or_(*filters))
        if net_worths:
            net_worths = net_worths.split(',')
            net_worth_filters = self.build_net_worth_filters(net_worths)
            query = query.filter(or_(*net_worth_filters))

        offset = (page - 1) * per_page
        leads_data = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page) if per_page > 0 else 1
        return leads_data, count, max_page
    
    def update_leads_by_customer(self, customer: Customer, user_id: int):
        existing_lead_user = self.db.query(LeadUser).join(Lead, Lead.id == LeadUser.lead_id).filter(
                                    Lead.business_email == customer.business_email, LeadUser.user_id == user_id).first()
        if existing_lead_user:
            self.db.query(LeadUser).filter(LeadUser.id == existing_lead_user.id).update({LeadUser.status: 'Existing'})
        else:
            lead = Lead(**customer.__dict__)
            self.db.add(lead)
            self.db.commit()
            self.db.add(LeadUser(lead_id=lead.id, user_id=user_id, status='New', funnel='Converted'))
            self.db.commit()
