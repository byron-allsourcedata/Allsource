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
from models.five_x_five_users import FiveXFiveUser
from models.leads_visits import LeadsVisits
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.five_x_five_names import FiveXFiveNames
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_users_phones import FiveXFiveUsersPhones
from models.five_x_five_phones import FiveXFivePhones
from models.leads import Lead
from models.five_x_five_users_locations import FiveXFiveUsersLocations
from models.leads_users import LeadUser
from models.five_x_five_locations import FiveXFiveLocations

from schemas.integrations import Customer

logger = logging.getLogger(__name__)


class LeadsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def filter_leads(self, user_id, page, per_page, status, from_date, to_date, from_time, to_time, regions, page_visits, average_time_spent,
                     lead_funnels, recurring_visits, sort_by, sort_order, search_query):
        subquery = (
            self.db.query(
                LeadsVisits.lead_id,
                func.max(LeadsVisits.full_time_sec).label('time_on_site'),
                func.max(LeadsVisits.start_date).label('start_date'),
                func.max(LeadsVisits.start_time).label('start_time'),
                func.max(LeadsVisits.pages_count).label('pages_count'),
                func.max(LeadsVisits.average_time_sec).label('average_time_sec'),
            )
            .group_by(LeadsVisits.lead_id)
            .subquery()
        )
        query = (
            self.db.query(
                FiveXFiveUser,
                LeadUser.status,
                LeadUser.funnel,
                FiveXFiveLocations.state,
                FiveXFiveLocations.city,
                subquery.c.start_date,
                subquery.c.start_time,
                subquery.c.time_on_site
            )
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
            .join(FiveXFiveUsersLocations, FiveXFiveUsersLocations.five_x_five_user_id == FiveXFiveUser.id)
            .join(FiveXFiveLocations, FiveXFiveLocations.id == FiveXFiveUsersLocations.location_id)
            .join(FiveXFiveNames, FiveXFiveNames.id == FiveXFiveUser.first_name_id)
            .join(FiveXFiveNames, FiveXFiveNames.id == FiveXFiveUser.last_name_id)
            .join(FiveXFiveUsersEmails, FiveXFiveUsersEmails.user_id == user_id)
            .join(FiveXFiveEmails, FiveXFiveEmails.id == FiveXFiveUsersEmails.email_id)
            .join(FiveXFiveUsersPhones, FiveXFiveUsersPhones.user_id == user_id)
            .join(FiveXFivePhones, FiveXFivePhones.id == FiveXFiveUsersPhones.phone_id)
            .outerjoin(subquery, LeadUser.id == subquery.c.lead_id)
            .filter(LeadUser.user_id == user_id)
        )
        sort_options = {
            'name': FiveXFiveUser.first_name,
            'business_email': FiveXFiveUser.business_email,
            'mobile_phone': FiveXFiveUser.mobile_phone,
            'gender': FiveXFiveUser.gender,
            'last_visited_date': subquery.c.start_date,
            'status': LeadUser.status,
            'funnel': LeadUser.funnel,
            'state': FiveXFiveLocations.state,
            'city': FiveXFiveLocations.city,
            'age': FiveXFiveUser.age_min,
            'time_spent': subquery.c.start_date
        }
        if sort_by:
            sort_column = sort_options[sort_by]
            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            elif sort_order == 'desc':
                query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(subquery.c.start_date))

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
            query = query.filter(
                and_(
                    subquery.c.start_date >= start_date,
                    subquery.c.start_date <= end_date
                )
            )
        if from_time and to_time:
            from_time = datetime.fromtimestamp(from_time, tz=pytz.UTC)
            to_time = datetime.fromtimestamp(to_time, tz=pytz.UTC)
            query = query.filter(
                and_(
                    subquery.c.start_time >= from_time,
                    subquery.c.start_time <= to_time
                )
            )

        if recurring_visits:
            pages_count = int(recurring_visits)
            if pages_count > 4:
                query = query.filter(
                    subquery.c.pages_count > pages_count
            )
            else:
                query = query.filter(
                        subquery.c.pages_count == pages_count
                )
        if regions:
            region_list = regions.split(',')
            region_filters = [FiveXFiveLocations.city.ilike(f'%{region.strip()}%') for region in region_list]
            query = query.filter(or_(*region_filters))

        if status == 'new_customers':
            query = query.filter(LeadUser.status == 'New')
        elif status == 'existing_customers':
            query = query.filter(LeadUser.status == 'Existing') 

        if lead_funnels:
            funnel_list = lead_funnels.split(',')
            query = query.filter(LeadUser.funnel.in_(funnel_list))

        if page_visits:
            query = query.filter(subquery.c.pages_count >= page_visits)

        if average_time_spent:
            query = query.filter(subquery.c.average_time_sec >= average_time_spent)

        if search_query:
            search_conditions = or_(
                FiveXFiveNames.name.ilike(f'{search_query}%'),
                FiveXFiveEmails.email.ilike(f'{search_query}%'),
                FiveXFiveEmails.email_host.ilike(f'{search_query}%'),
                FiveXFivePhones.number.ilike(f'{search_query}%'),
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
            self.db.query(FiveXFiveUser)
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
            .filter(
                LeadUser.user_id == user_id,
                FiveXFiveUser.id.in_(leads_ids)
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
                FiveXFiveLocations.state,
                FiveXFiveLocations.city,
            )
            .join(FiveXFiveUsersLocations, FiveXFiveUsersLocations.five_x_five_user_id == Lead.id)
            .join(FiveXFiveLocations, FiveXFiveUsersLocations.location_id == FiveXFiveUsersLocations.id)
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
            filters = [FiveXFiveLocations.city == region.lower() for region in regions]
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
