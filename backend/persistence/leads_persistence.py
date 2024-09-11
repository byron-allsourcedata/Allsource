import logging
import math
import io
import csv

from datetime import datetime, timedelta

import pytz
from sqlalchemy import and_, or_, desc, asc, Integer, distinct
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


logger = logging.getLogger(__name__)


class LeadsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def filter_leads(self, user_id, page, per_page, status, from_date, to_date, from_time, to_time, regions, page_visits, average_time_spent,
                     lead_funnels, recurring_visits, sort_by, sort_order, search_query):
        
        recurring_visits_subquery = (
        self.db.query(
            LeadsVisits.lead_id,
            func.count().label('recurring_visits')
        )
        .group_by(LeadsVisits.lead_id)
        .subquery()
        )
        
        query = (
            self.db.query(
            # distinct(FiveXFiveUser.id),
            FiveXFiveUser.id,
            FiveXFiveUser.first_name,
            FiveXFiveUser.programmatic_business_emails,
            FiveXFiveUser.mobile_phone,
            FiveXFiveUser.direct_number,
            FiveXFiveUser.gender,
            FiveXFiveUser.personal_phone,
            FiveXFiveUser.business_email,
            FiveXFiveUser.personal_emails,
            FiveXFiveUser.last_name,
            FiveXFiveUser.personal_city,
            FiveXFiveUser.personal_state,
            FiveXFiveUser.company_name,
            FiveXFiveUser.company_domain,
            FiveXFiveUser.company_phone,
            FiveXFiveUser.company_sic,
            FiveXFiveUser.company_address,
            FiveXFiveUser.company_city,
            FiveXFiveUser.company_state,
            FiveXFiveUser.company_linkedin_url,
            FiveXFiveUser.company_revenue,
            FiveXFiveUser.company_employee_count,
            FiveXFiveUser.net_worth,
            FiveXFiveUser.job_title,
            FiveXFiveUser.last_updated,
            FiveXFiveUser.personal_emails_last_seen,
            FiveXFiveUser.company_last_updated,
            FiveXFiveUser.job_title_last_updated,
            FiveXFiveUser.age_min,
            FiveXFiveUser.age_max,
            FiveXFiveUser.additional_personal_emails,
            FiveXFiveUser.linkedin_url,
            FiveXFiveUser.personal_address,
            FiveXFiveUser.personal_address_2,
            FiveXFiveUser.married,
            FiveXFiveUser.children,
            FiveXFiveUser.income_range,
            FiveXFiveUser.homeowner,
            FiveXFiveUser.seniority_level,
            FiveXFiveUser.department,
            FiveXFiveUser.professional_address,
            FiveXFiveUser.professional_address_2,
            FiveXFiveUser.professional_city,
            FiveXFiveUser.professional_state,
            FiveXFiveUser.primary_industry,
            FiveXFiveUser.business_email_validation_status,
            FiveXFiveUser.business_email_last_seen,
            FiveXFiveUser.personal_emails_validation_status,
            FiveXFiveUser.work_history,
            FiveXFiveUser.education_history,
            FiveXFiveUser.company_description,
            FiveXFiveUser.related_domains,
            FiveXFiveUser.social_connections,
            FiveXFiveUser.personal_zip,
            FiveXFiveUser.professional_zip,
            FiveXFiveUser.company_zip,
            LeadUser.status,
            LeadUser.funnel,
            FiveXFiveLocations.state,
            FiveXFiveLocations.city,
            LeadsVisits.start_date.label('start_date'),
            LeadsVisits.start_time.label('start_time'),
            LeadsVisits.full_time_sec.label('time_on_site'),
            recurring_visits_subquery.c.recurring_visits
            )
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)    
            .join(FiveXFiveNames, FiveXFiveNames.id == FiveXFiveUser.first_name_id)
            .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)  
            .outerjoin(FiveXFiveUsersLocations, FiveXFiveUsersLocations.five_x_five_user_id == FiveXFiveUser.id)
            .outerjoin(FiveXFiveLocations, FiveXFiveLocations.id == FiveXFiveUsersLocations.location_id)
            .outerjoin(recurring_visits_subquery, recurring_visits_subquery.c.lead_id == LeadUser.id) 
            .filter(LeadUser.user_id == user_id)
        )
        sort_options = {
            'name': FiveXFiveUser.first_name,
            'business_email': FiveXFiveUser.business_email,
            'mobile_phone': FiveXFiveUser.mobile_phone,
            'gender': FiveXFiveUser.gender,
            'last_visited_date': LeadsVisits.start_date,
            'status': LeadUser.status,
            'funnel': LeadUser.funnel,
            'state': FiveXFiveLocations.state,
            'city': FiveXFiveLocations.city,
            'age': FiveXFiveUser.age_min,
            'time_spent': LeadsVisits.full_time_sec
        }
        if sort_by:
            sort_column = sort_options[sort_by]
            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            elif sort_order == 'desc':
                query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(LeadsVisits.start_date))

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
            query = query.filter(
                and_(
                    LeadsVisits.start_date >= start_date,
                    LeadsVisits.start_date <= end_date
                )
            )
        if from_time and to_time:
            from_time = datetime.strptime(from_time, '%H:%M').time()
            to_time = datetime.strptime(to_time, '%H:%M').time()
            query = query.filter(
                and_(
                    LeadsVisits.start_time >= from_time,
                    LeadsVisits.start_time <= to_time
                )
            )

        if recurring_visits:
            recurring_visits_list = recurring_visits.split(',')
            for recurring_visit in recurring_visits_list:
                if recurring_visit > 4:
                    query = query.filter(
                        recurring_visits_subquery.c.recurring_visits > recurring_visit
                    )
                else:
                    query = query.filter(
                        recurring_visits_subquery.c.recurring_visits == recurring_visit
                    )
            query = query.filter(or_(*region_filters))
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
            page_visits_list = [int(visit) for visit in page_visits.split(',')]
            filters = []
            for visit in page_visits_list:
                if visit > 3:
                    filters.append(LeadsVisits.pages_count > visit)
                else:
                    filters.append(LeadsVisits.pages_count == visit)
            query = query.filter(or_(*filters))

        if average_time_spent:
            page_visits_list = average_time_spent.split(',')
            filters = []
            for visit in page_visits_list:
                if visit == 'under_10_secs':
                    filters.append(LeadsVisits.average_time_sec < 10)
                elif visit == '10-30 secs':
                    filters.append(LeadsVisits.average_time_sec >= 10 and LeadsVisits.average_time_sec <= 30)
                elif visit == '30-60 secs':
                    filters.append(LeadsVisits.average_time_sec >= 30 and LeadsVisits.average_time_sec <= 60)
                else:
                    filters.append(LeadsVisits.average_time_sec > 60)
            query = query.filter(or_(*filters))

        if search_query:
            query = (
            query
            .outerjoin(FiveXFiveUsersEmails, FiveXFiveUsersEmails.user_id == FiveXFiveUser.id)
            .outerjoin(FiveXFiveEmails, FiveXFiveEmails.id == FiveXFiveUsersEmails.email_id)
            .outerjoin(FiveXFiveUsersPhones, FiveXFiveUsersPhones.user_id == FiveXFiveUser.id)
            .outerjoin(FiveXFivePhones, FiveXFivePhones.id == FiveXFiveUsersPhones.phone_id)
            )

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
        lead = self.db.query(FiveXFiveUser).filter(FiveXFiveUser.id == lead_id).first()

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
    
    def get_leads_users_by_lead_id(self, lead_id: int, user_id: int) -> LeadUser:
        return self.db.query(LeadUser).filter(LeadUser.five_x_five_user_id == lead_id, LeadUser.user_id == user_id).first()
    
    def get_leads_user_filter_by_email(self, user_id: int, email: str):
        return self.db.query(LeadUser).join(FiveXFiveUser, FiveXFiveUser.id == LeadUser.five_x_five_user_id).filter(LeadUser.user_id == user_id, 
                                                                                         FiveXFiveUser.business_email == email).all()

    def get_leads_user(self, user_id: int, **filter_by):
        return self.db.query(LeadUser).filter_by(**filter_by)