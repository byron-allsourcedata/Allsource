import logging
import math
from datetime import datetime, timedelta

import pytz
from sqlalchemy import and_, or_, desc, asc, Integer, distinct, select
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import func
from utils import format_phone_number
from models.audience import Audience
from models.audience_leads import AudienceLeads
from models.five_x_five_emails import FiveXFiveEmails
from models.leads_requests import LeadsRequests
from models.five_x_five_locations import FiveXFiveLocations
from models.five_x_five_names import FiveXFiveNames
from models.five_x_five_phones import FiveXFivePhones
from models.five_x_five_users import FiveXFiveUser
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.five_x_five_users_locations import FiveXFiveUsersLocations
from models.five_x_five_users_phones import FiveXFiveUsersPhones
from models.leads import Lead
from enums import ProccessDataSyncResult
from utils import extract_first_email
from models.leads_orders import LeadOrders
from models.leads_users import LeadUser
from models.leads_users_added_to_cart import LeadsUsersAddedToCart
from models.leads_users_ordered import LeadsUsersOrdered
from models.leads_visits import LeadsVisits
from models.state import States
from models.subscription_transactions import SubscriptionTransactions
from models.users_unlocked_5x5_users import UsersUnlockedFiveXFiveUser

logger = logging.getLogger(__name__)


def create_age_conditions(age_str: str):
    filters = []
    for part in age_str:
        if '-' in part:
            start, end = map(int, part.split('-'))
            filters.append(and_(Lead.age_min <= end, Lead.age_max >= start))
        else:
            age = int(part)
            filters.append(and_(Lead.age_min <= age, Lead.age_max >= age))
    return filters


def build_net_worth_filters(net_worth_str: str):
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


def normalize_profession(profession: str) -> str:
    return profession.lower().replace(" ", "-")


class LeadsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def filter_leads(self, domain_id, page, per_page, from_date, to_date, from_time, to_time, regions, page_visits,
                     average_time_sec, behavior_type, recurring_visits, sort_by, sort_order, search_query, status):
        
        FirstNameAlias = aliased(FiveXFiveNames)
        LastNameAlias = aliased(FiveXFiveNames)

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
                LeadUser.behavior_type,
                FiveXFiveUser.personal_state,
                FiveXFiveUser.personal_city,
                LeadsVisits.start_date.label('start_date'),
                LeadsVisits.start_time.label('start_time'),
                LeadsVisits.full_time_sec.label('time_on_site'),
                recurring_visits_subquery.c.recurring_visits,
                LeadUser.is_returning_visitor,
                LeadUser.avarage_visit_time,
                LeadUser.is_converted_sales,
                LeadUser.is_active,
                LeadUser.id,
            )
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
            .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
            .outerjoin(FirstNameAlias, FirstNameAlias.id == FiveXFiveUser.first_name_id)
            .outerjoin(LastNameAlias, LastNameAlias.id == FiveXFiveUser.last_name_id)
            .outerjoin(FiveXFiveUsersLocations, FiveXFiveUsersLocations.five_x_five_user_id == FiveXFiveUser.id)
            .outerjoin(FiveXFiveLocations, FiveXFiveLocations.id == FiveXFiveUsersLocations.location_id)
            .outerjoin(States, States.id == FiveXFiveLocations.state_id)
            .outerjoin(recurring_visits_subquery, recurring_visits_subquery.c.lead_id == LeadUser.id)
            .filter(LeadUser.domain_id == domain_id)
            .group_by(
                FiveXFiveUser.id,
                LeadUser.behavior_type,
                LeadUser.is_returning_visitor,
                LeadsVisits.start_date,
                LeadsVisits.start_time,
                LeadsVisits.full_time_sec,
                recurring_visits_subquery.c.recurring_visits,
                LeadUser.avarage_visit_time,
                LeadUser.is_converted_sales,
                LeadUser.is_active,
                LeadUser.id
            )
        )
        sort_options = {
            'name': FiveXFiveUser.first_name,
            'business_email': FiveXFiveUser.business_email,
            'personal_email': FiveXFiveUser.personal_emails,
            'mobile_phone': FiveXFiveUser.mobile_phone,
            'gender': FiveXFiveUser.gender,
            'first_visited_date': LeadsVisits.start_date,
            'state': FiveXFiveLocations.state_id,
            'city': FiveXFiveLocations.city,
            'age': FiveXFiveUser.age_min,
            'average_time_sec': LeadUser.avarage_visit_time,
            'status': LeadUser.is_returning_visitor,
            'funnel': LeadUser.behavior_type,
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
                    or_(
                        and_(
                            LeadsVisits.start_date == start_date.date(),
                            LeadsVisits.start_time >= start_date.time()
                        ),  
                        and_(
                            LeadsVisits.start_date == end_date.date(),
                            LeadsVisits.start_time <= end_date.time()
                        ),  
                        and_(
                            LeadsVisits.start_date > start_date.date(),
                            LeadsVisits.start_date < end_date.date()
                        )
                    )
                )
            )
            
        if status:
            status_list = status.split(',')
            filters = []

            for status_data in status_list:
                if status_data == 'converted_sales':
                    filters.append(LeadUser.is_converted_sales == True)

                elif status_data == 'view_product':
                    if 'converted_sales' not in status_list:
                        filters.append(and_(
                            LeadUser.behavior_type == "viewed_product",
                            LeadUser.is_converted_sales == False
                        ))
                    else:
                        filters.append(and_(LeadUser.behavior_type == "viewed_product"))

                elif status_data == 'visitor':
                    if 'converted_sales' not in status_list:
                        filters.append(and_(
                            LeadUser.behavior_type == "visitor",
                            LeadUser.is_converted_sales == False
                        ))
                    else:
                        filters.append(and_(LeadUser.behavior_type == "visitor"))

                elif status_data == 'abandoned_cart':
                    query = query.outerjoin(
                        LeadsUsersAddedToCart, LeadsUsersAddedToCart.lead_user_id == LeadUser.id
                    ).outerjoin(
                        LeadsUsersOrdered, LeadsUsersOrdered.lead_user_id == LeadUser.id
                    )

                    filters.append(
                        and_(
                            LeadUser.behavior_type == "product_added_to_cart",
                            LeadUser.is_converted_sales == False,
                            LeadsUsersAddedToCart.added_at.isnot(None),
                            or_(
                                LeadsUsersAddedToCart.added_at > LeadsUsersOrdered.ordered_at,
                                and_(
                                    LeadsUsersOrdered.ordered_at.is_(None),
                                    LeadsUsersAddedToCart.added_at.isnot(None)
                                )
                            )
                        )
                    )

            query = query.filter(or_(*filters))


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
            filters = []
            for recurring_visit in recurring_visits_list:
                if recurring_visit == '4+':
                    filters.append(recurring_visits_subquery.c.recurring_visits > 4)
                else:
                    filters.append(recurring_visits_subquery.c.recurring_visits == recurring_visit)
            query = query.filter(or_(*filters))
            
        if regions:
            filters = []
            region_list = regions.split(',')
            for region_data in region_list:
                region_data = region_data.split('-')
                filters.append(FiveXFiveLocations.city.ilike(f'{region_data[0]}%'))

                if len(region_data) > 1 and region_data[1]:
                    filters.append(States.state_name.ilike(f'{region_data[1]}%'))

            query = query.filter(or_(*filters))

        if behavior_type:
            behavior_type_list = behavior_type.split(',')
            filters = []
            for behavior in behavior_type_list:
                if behavior == 'returning':
                    filters.append(LeadUser.is_returning_visitor == True)
                elif behavior == 'new':
                    filters.append(LeadUser.is_returning_visitor == False)
            query = query.filter(or_(*filters))

        if page_visits:
            page_visits_list = page_visits.split(',')
            filters = []
            for visit in page_visits_list:
                if visit == 'more_than_3_pages':
                    filters.append(LeadsVisits.pages_count > 3)
                elif visit == '2_pages':
                    filters.append(LeadsVisits.pages_count == 2)
                elif visit == '3_pages':
                    filters.append(LeadsVisits.pages_count == 3)
                elif visit == '1_pages':
                    filters.append(LeadsVisits.pages_count == 1)
            query = query.filter(or_(*filters))

        if average_time_sec:
            page_visits_list = average_time_sec.split(',')
            filters = []
            for visit in page_visits_list:
                if visit == 'under_10':
                    filters.append(LeadUser.avarage_visit_time <= 10)
                elif visit == '10-30_secs':
                    filters.append(and_(LeadUser.avarage_visit_time > 10, LeadUser.avarage_visit_time <= 30))
                elif visit == '30-60_secs':
                    filters.append(and_(LeadUser.avarage_visit_time > 30, LeadUser.avarage_visit_time <= 60))
                else:
                    filters.append(LeadUser.avarage_visit_time > 60)
            query = query.filter(or_(*filters))

        if search_query:
            query = (
                query
                .outerjoin(FiveXFiveUsersEmails, FiveXFiveUsersEmails.user_id == FiveXFiveUser.id)
                .outerjoin(FiveXFiveEmails, FiveXFiveEmails.id == FiveXFiveUsersEmails.email_id)
                .outerjoin(FiveXFiveUsersPhones, FiveXFiveUsersPhones.user_id == FiveXFiveUser.id)
                .outerjoin(FiveXFivePhones, FiveXFivePhones.id == FiveXFiveUsersPhones.phone_id)
            )

            filters = [
                FiveXFiveEmails.email.ilike(f'{search_query}%'),
                FiveXFiveEmails.email_host.ilike(f'{search_query}%'),
                FiveXFivePhones.number.ilike(f"{search_query.replace('+', '')}%")
            ]
            search_query = search_query.split()
            if len(search_query) == 1:
                filters.extend([
                    FirstNameAlias.name.ilike(f'{search_query[0].strip()}%'),
                    LastNameAlias.name.ilike(f'{search_query[0].strip()}%')
                ])
            elif len(search_query) == 2:
                name_filter = and_(
                    FirstNameAlias.name.ilike(f'{search_query[0].strip()}%'),
                    LastNameAlias.name.ilike(f'{search_query[1].strip()}%')
                )
                filters.append(name_filter)

            query = query.filter(or_(*filters))

        offset = (page - 1) * per_page
        leads = query.limit(per_page).offset(offset).all()
        lead_ids = [lead.id for lead in leads]
        latest_page_time_subquery = (
            self.db.query(
                LeadsRequests.lead_id,
                LeadsRequests.page,
                func.sum(LeadsRequests.spent_time_sec).label("total_spent_time")
            )
            .filter(LeadsRequests.lead_id.in_(lead_ids))
            .group_by(LeadsRequests.lead_id, LeadsRequests.page)
            .subquery()
        )

        filtered_page_time_query = (
            self.db.query(
                latest_page_time_subquery.c.lead_id,
                latest_page_time_subquery.c.page,
                latest_page_time_subquery.c.total_spent_time
            )
            .all()
        )

        leads_requests = {}

        for row in filtered_page_time_query:
            lead_id = row.lead_id
            if lead_id not in leads_requests:
                leads_requests[lead_id] = []
            leads_requests[lead_id].append({
                "page": row.page,
                "spent_time_sec": row.total_spent_time
            })

        count = query.count()
        max_page = math.ceil(count / per_page)
        states = None
        if leads:
            states = self.db.query(States).all()
        return leads, count, max_page, states, leads_requests
    
    def get_new_leads_per_day(self, domain_id, start_date, end_date):
        query = (
            self.db.query(
                func.date(LeadsVisits.start_date).label("start_date"),
                func.count(LeadUser.id.distinct()).label("new_leads")
            )
            .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
            .where(
                LeadUser.domain_id == domain_id,
                LeadsVisits.start_date >= start_date,
                LeadsVisits.end_date <= end_date
            )
            .where(
                LeadUser.id.notin_(
                    select(LeadUser.id)
                    .join(LeadsVisits, LeadsVisits.lead_id == LeadUser.id)
                    .where(LeadsVisits.start_date < start_date)
                )
            )
            .group_by(func.date(LeadsVisits.start_date))
        )
        return query.all()
    
    def get_returning_visitors_per_day(self, domain_id, start_date, end_date):
        active_users_subquery = (
            select(LeadsVisits.lead_id)
            .join(LeadUser, LeadUser.id == LeadsVisits.lead_id)
            .where(
                LeadUser.domain_id == domain_id,
                LeadsVisits.start_date <= start_date,
            )
            .distinct()
            .subquery()
        )
        query = (
            self.db.query(
                func.date(LeadsVisits.start_date).label("start_date"),
                func.count(LeadsVisits.lead_id.distinct()).label("returning_visitors")
            )
            .join(LeadUser, LeadUser.id == LeadsVisits.lead_id)
            .join(active_users_subquery, active_users_subquery.c.lead_id == LeadsVisits.lead_id)
            .where(
                LeadUser.domain_id == domain_id,
                LeadsVisits.start_date >= start_date,
                LeadsVisits.end_date <= end_date
            )
            .group_by(func.date(LeadsVisits.start_date))
        )
        
        return query.all()
    
    def get_visit_stats(self, five_x_five_user_id: int):
        recurring_visits_subquery = (
            self.db.query(
                LeadsVisits.lead_id,
                func.count().label('url_visited')
            )
            .group_by(LeadsVisits.lead_id)
            .subquery()
        )

        result = (
            self.db.query(
                LeadsVisits.full_time_sec.label('time_on_site'),
                recurring_visits_subquery.c.url_visited,
            )
            .select_from(LeadUser)
            .join(FiveXFiveUser, FiveXFiveUser.id == LeadUser.five_x_five_user_id)
            .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
            .outerjoin(recurring_visits_subquery, recurring_visits_subquery.c.lead_id == LeadUser.id)
            .filter(FiveXFiveUser.id == five_x_five_user_id)
            .first()
        )

        return (result.time_on_site, result.url_visited) if result else (0, 0)
    
    def get_page_views_per_day(self, domain_id, start_date, end_date):
        query = (
            self.db.query(
                func.date(LeadsVisits.start_date).label("start_date"),
                func.sum(LeadsVisits.pages_count).label("page_views")
            )
            .join(LeadUser, LeadsVisits.lead_id == LeadUser.id)
            .where(
                LeadUser.domain_id == domain_id,
                LeadsVisits.start_date >= start_date,
                LeadsVisits.end_date <= end_date
            )
            .group_by(func.date(LeadsVisits.start_date))
        )
        return query.all()
    
    def get_contact_data_for_d2c(self, domain_id, from_date, to_date):
        query = (
            self.db.query(
                LeadsVisits.start_date,
                LeadUser.behavior_type,
                LeadUser.is_converted_sales,
                func.count(LeadUser.id).label('lead_count')
            )
            .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
            .group_by(LeadsVisits.start_date, LeadUser.behavior_type, LeadUser.is_converted_sales)
            .filter(LeadUser.domain_id == domain_id)
        )

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
            query = query.filter(
                and_(
                    LeadsVisits.start_date >= start_date,
                    LeadsVisits.start_date <= end_date
                )
            )

        results = query.all()
        return results

    def get_contact_data_for_b2b(self, domain_id, from_date, to_date):
        start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
        end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
        new_leads_data = self.get_new_leads_per_day(domain_id, start_date, end_date)
        returning_visitors_data = self.get_returning_visitors_per_day(domain_id, start_date, end_date)
        page_views_data = self.get_page_views_per_day(domain_id, start_date, end_date)
        return new_leads_data, returning_visitors_data, page_views_data

    def get_lifetime_revenue(self, domain_id):
        total_revenue = (
                            self.db.query(func.sum(LeadOrders.total_price))
                            .join(LeadUser, LeadOrders.lead_user_id == LeadUser.id)
                            .filter(LeadUser.domain_id == domain_id)
                        ).scalar() or 0
        return total_revenue

    def get_investment(self, user_id):
        transactions = self.db.query(SubscriptionTransactions).filter(
            SubscriptionTransactions.user_id == user_id
        ).all()
        unique_combinations = set()
        total_investment = 0

        for transaction in transactions:
            key = (transaction.price_id, transaction.start_date, transaction.end_date)
            if key not in unique_combinations:
                unique_combinations.add(key)
                total_investment += transaction.amount if transaction.amount else 0

        return total_investment

    def get_revenue_data(self, domain_id, from_date, to_date, user_id):
        query = (
            self.db.query(
                LeadsVisits.start_date,
                LeadsVisits.behavior_type,
                func.sum(LeadOrders.total_price).label('total_price'),
                func.count(LeadOrders.id).label('total_orders')
            )
            .join(LeadUser, LeadsVisits.id == LeadUser.first_visit_id)
            .join(LeadOrders, LeadOrders.lead_user_id == LeadUser.id)
            .filter(LeadUser.domain_id == domain_id)
        )

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
            query = query.filter(
                and_(
                    LeadsVisits.start_date >= start_date,
                    LeadsVisits.start_date <= end_date
                )
            )

        query = query.group_by(func.date(LeadsVisits.start_date), LeadsVisits.behavior_type)

        lifetime_revenue = self.get_lifetime_revenue(domain_id)
        investment = self.get_investment(user_id)

        results = query.all()
        return results, lifetime_revenue, investment

    def get_lead_data(self, lead_id):
        return self.db.query(FiveXFiveUser).filter(FiveXFiveUser.id == lead_id).first()
    
    def get_latest_page_time(self, lead_id):
        latest_page_time_subquery = (
            self.db.query(
                LeadsRequests.page, 
                func.sum(LeadsRequests.spent_time_sec).label("total_spent_time")
            )
            .filter(LeadsRequests.lead_id == lead_id)
            .group_by(LeadsRequests.page)
            .all()
        )
        return latest_page_time_subquery

    def get_inactive_leads_user(self, user_id):
        return (
            self.db.query(LeadUser)
            .filter(LeadUser.user_id == user_id, LeadUser.is_active.is_(False))
            .order_by(LeadUser.id)
            .all()
        )

    def get_ids_user_leads_ids(self, domain_id, leads_ids):
        lead_users = self.db.query(LeadUser).filter(LeadUser.domain_id == domain_id,
                                                    LeadUser.lead_id.in_(leads_ids)).all()
        lead_ids_set = {lead_user.lead_id for lead_user in lead_users}
        return lead_ids_set

    def get_full_user_leads_by_ids(self, domain_id, leads_ids):
        result_query = (
            self.db.query(LeadUser.id, FiveXFiveUser)
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
            .filter(
                LeadUser.domain_id == domain_id,
                LeadUser.is_active.is_(True),
                FiveXFiveUser.id.in_(leads_ids)
            )
            .all()
        )
        
        if not result_query:
            return None, None, {}
        
        lead_user_ids, five_x_five_users = zip(*result_query)
        leads_requests = {}

        latest_page_time_subquery = (
            self.db.query(
                LeadsRequests.lead_id,
                LeadsRequests.page,
                func.sum(LeadsRequests.spent_time_sec).label("total_spent_time")
            )
            .filter(LeadsRequests.lead_id.in_(lead_user_ids))
            .group_by(LeadsRequests.lead_id, LeadsRequests.page)
            .subquery()
        )
        
        filtered_page_time_query = (
            self.db.query(
                latest_page_time_subquery.c.lead_id,
                latest_page_time_subquery.c.page,
                latest_page_time_subquery.c.total_spent_time
            )
            .all()
        )

        for row in filtered_page_time_query:
            lead_id = row.lead_id
            if lead_id not in leads_requests:
                leads_requests[lead_id] = []
            leads_requests[lead_id].append({
                "page": row.page,
                "spent_time_sec": row.total_spent_time
            })

        return result_query, self.db.query(States).all(), leads_requests

    def get_full_user_leads_by_filters(self, domain_id, from_date, to_date, regions, page_visits,
                                   average_time_spent, behavior_type, status, recurring_visits, sort_by, sort_order,
                                   search_query, from_time, to_time):
        FirstNameAlias = aliased(FiveXFiveNames)
        LastNameAlias = aliased(FiveXFiveNames)

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
                LeadUser.id,
                FiveXFiveUser
            )
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
            .join(FirstNameAlias, FirstNameAlias.id == FiveXFiveUser.first_name_id)
            .join(LastNameAlias, LastNameAlias.id == FiveXFiveUser.last_name_id)
            .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
            .outerjoin(FiveXFiveUsersLocations, FiveXFiveUsersLocations.five_x_five_user_id == FiveXFiveUser.id)
            .outerjoin(FiveXFiveLocations, FiveXFiveLocations.id == FiveXFiveUsersLocations.location_id)
            .outerjoin(States, States.id == FiveXFiveLocations.state_id)
            .outerjoin(recurring_visits_subquery, recurring_visits_subquery.c.lead_id == LeadUser.id)
            .filter(LeadUser.domain_id == domain_id, LeadUser.is_active.is_(True))
            .group_by(FiveXFiveUser.id, LeadUser.id, LeadsVisits.start_date)
            .order_by(desc(LeadsVisits.start_date))
        )

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
            query = query.filter(LeadsVisits.start_date.between(start_date, end_date))
        
        if status:
            status_filters = []
            status_map = {
                'converted_sales': LeadUser.is_converted_sales.is_(True),
                'view_product': LeadUser.behavior_type == "viewed_product",
                'visitor': LeadUser.behavior_type == "visitor"
            }
            
            for s in status.split(','):
                if s in status_map:
                    status_filters.append(status_map[s])
                elif s == 'abandoned_cart':
                    query = query.join(LeadsUsersAddedToCart, LeadsUsersAddedToCart.lead_user_id == LeadUser.id)
                    query = query.outerjoin(LeadsUsersOrdered, LeadsUsersOrdered.lead_user_id == LeadUser.id)
                    query = query.filter(
                        LeadsUsersAddedToCart.added_at.isnot(None),
                        or_(
                            LeadsUsersAddedToCart.added_at > LeadsUsersOrdered.ordered_at,
                            and_(LeadsUsersOrdered.ordered_at.is_(None), LeadsUsersAddedToCart.added_at.isnot(None))
                        )
                    )
            
            if status_filters:
                query = query.filter(or_(*status_filters))
        
        if from_time and to_time:
            query = query.filter(LeadsVisits.start_time.between(from_time, to_time))
        
        if recurring_visits:
            visit_filters = [recurring_visits_subquery.c.recurring_visits == int(v) if v.isdigit() else recurring_visits_subquery.c.recurring_visits > 4
                            for v in recurring_visits.split(',')]
            query = query.filter(or_(*visit_filters))
        
        if regions:
            region_filters = [FiveXFiveLocations.city.ilike(f'{region.split("-")[0]}%') for region in regions.split(',')]
            query = query.filter(or_(*region_filters))
        
        if behavior_type:
            behavior_map = {
                'returning': LeadUser.is_returning_visitor.is_(True),
                'new': LeadUser.is_returning_visitor.is_(False)
            }
            query = query.filter(or_(*(behavior_map[b] for b in behavior_type.split(',') if b in behavior_map)))
        
        if page_visits:
            visit_map = {
                'more_than_3_pages': LeadsVisits.pages_count > 3,
                '2_pages': LeadsVisits.pages_count == 2,
                '3_pages': LeadsVisits.pages_count == 3,
                '1_pages': LeadsVisits.pages_count == 1
            }
            query = query.filter(or_(*(visit_map[v] for v in page_visits.split(',') if v in visit_map)))
        
        if average_time_spent:
            time_map = {
                'under_10_secs': LeadsVisits.average_time_sec < 10,
                '10-30_secs': and_(LeadsVisits.average_time_sec >= 10, LeadsVisits.average_time_sec <= 30),
                '30-60_secs': and_(LeadsVisits.average_time_sec >= 30, LeadsVisits.average_time_sec <= 60),
                'over_60_secs': LeadsVisits.average_time_sec > 60
            }
            query = query.filter(or_(*(time_map[t] for t in average_time_spent.split(',') if t in time_map)))
        
        if search_query:
            query = query.outerjoin(FiveXFiveUsersEmails, FiveXFiveUsersEmails.user_id == FiveXFiveUser.id)
            query = query.outerjoin(FiveXFiveEmails, FiveXFiveEmails.id == FiveXFiveUsersEmails.email_id)
            query = query.outerjoin(FiveXFiveUsersPhones, FiveXFiveUsersPhones.user_id == FiveXFiveUser.id)
            query = query.outerjoin(FiveXFivePhones, FiveXFivePhones.id == FiveXFiveUsersPhones.phone_id)
            
            search_filters = [
                FiveXFiveEmails.email.ilike(f'{search_query}%'),
                FiveXFivePhones.number.ilike(f'{search_query}%')
            ]
            
            search_terms = search_query.split()
            if len(search_terms) == 1:
                search_filters.append(FirstNameAlias.name.ilike(f'{search_terms[0]}%'))
                search_filters.append(LastNameAlias.name.ilike(f'{search_terms[0]}%'))
            elif len(search_terms) == 2:
                search_filters.append(and_(
                    FirstNameAlias.name.ilike(f'{search_terms[0]}%'),
                    LastNameAlias.name.ilike(f'{search_terms[1]}%')
                ))
            query = query.filter(or_(*search_filters))
        
        result_query = query.limit(1000).all()
        
        if not result_query:
            return None, None, {}
        
        lead_user_ids, five_x_five_users = zip(*result_query)
        leads_requests = {}
        
        latest_page_time_subquery = (
            self.db.query(LeadsRequests.lead_id, LeadsRequests.page, func.sum(LeadsRequests.spent_time_sec).label("total_spent_time"))
            .filter(LeadsRequests.lead_id.in_(lead_user_ids))
            .group_by(LeadsRequests.lead_id, LeadsRequests.page)
            .subquery()
        )
        
        for row in self.db.query(latest_page_time_subquery).all():
            leads_requests.setdefault(row.lead_id, []).append({"page": row.page, "spent_time_sec": row.total_spent_time})

        return result_query, self.db.query(States).all(), leads_requests


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
                FiveXFiveLocations.state_id,
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
            normalized_professions = [normalize_profession(p) for p in professions]
            profession_filters = []
            for profession in normalized_professions:
                profession_filters.append(Lead.job_title.ilike(f"%{profession.replace('-', ' ')}%"))

            query = query.filter(or_(*profession_filters))
        if ages:
            ages = ages.split(',')
            age_filters = create_age_conditions(ages)
            query = query.filter(or_(*age_filters))
        if genders:
            genders = genders.split(',')
            filters = [Lead.gender == gender.upper() for gender in genders]
            query = query.filter(or_(*filters))
        if net_worths:
            net_worths = net_worths.split(',')
            net_worth_filters = build_net_worth_filters(net_worths)
            query = query.filter(or_(*net_worth_filters))

        offset = (page - 1) * per_page
        leads_data = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page) if per_page > 0 else 1
        return leads_data, count, max_page

    def get_leads_users_by_lead_id(self, lead_id: int, domain_id: int) -> LeadUser:
        return self.db.query(LeadUser).filter(LeadUser.five_x_five_user_id == lead_id,
                                              LeadUser.domain_id == domain_id).first()

    def get_leads_user_filter_by_email(self, domain_id: int, email: str):
        return self.db.query(LeadUser).join(FiveXFiveUser, FiveXFiveUser.id == LeadUser.five_x_five_user_id).filter(
            LeadUser.domain_id == domain_id,
            FiveXFiveUser.business_email == email
        ).all()

    def get_leads_domain(self, domain_id: int, **filter_by: dict):
        return self.db.query(LeadUser).filter_by(domain_id=domain_id, **filter_by).all()
    
    def get_last_leads_for_zapier(self, domain_id: int):
        lead_users = (
            self.db.query(LeadUser)
            .filter(LeadUser.domain_id == domain_id)\
            .order_by(LeadUser.created_at.desc())
            .limit(10)
            .all()
        )
        if not lead_users:
            return None
        
        recurring_visits_subquery = (
            self.db.query(
                LeadsVisits.lead_id,
                func.count(LeadsVisits.id).label('url_visited')
            )
            .group_by(LeadsVisits.lead_id)
            .subquery()
        )

        five_x_five_user_ids = [user.five_x_five_user_id for user in lead_users]

        five_x_five_users = (
            self.db.query(
                FiveXFiveUser.id,
                FiveXFiveUser.first_name,
                FiveXFiveUser.mobile_phone,
                FiveXFiveUser.direct_number,
                FiveXFiveUser.gender,
                FiveXFiveUser.personal_phone,
                FiveXFiveUser.personal_emails,
                FiveXFiveUser.business_email,
                FiveXFiveUser.additional_personal_emails,
                FiveXFiveUser.business_email_last_seen,
                FiveXFiveUser.personal_emails_last_seen,
                FiveXFiveUser.last_name,
                FiveXFiveUser.personal_city,
                FiveXFiveUser.personal_state,
                FiveXFiveUser.company_name,
                FiveXFiveUser.personal_zip,
                FiveXFiveUser.company_domain,
                FiveXFiveUser.job_title,
                FiveXFiveUser.last_updated,
                FiveXFiveUser.age_min,
                FiveXFiveUser.age_max,
                FiveXFiveUser.personal_address,
                FiveXFiveUser.married,
                FiveXFiveUser.homeowner,
                FiveXFiveUser.dpv_code,
                FiveXFiveUser.children,
                FiveXFiveUser.income_range,
                LeadsVisits.full_time_sec.label('time_on_site'),
                recurring_visits_subquery.c.url_visited,
            )
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
            .outerjoin(LeadsVisits, LeadsVisits.lead_id == LeadUser.id)
            .outerjoin(recurring_visits_subquery, recurring_visits_subquery.c.lead_id == LeadUser.id)
            .filter(FiveXFiveUser.id.in_(five_x_five_user_ids))
            .all()
        )
        return five_x_five_users
        
    def search_contact(self, start_letter, domain_id):
        letters = start_letter.split()
        FirstNameAlias = aliased(FiveXFiveNames)
        LastNameAlias = aliased(FiveXFiveNames)

        query = (
            self.db.query(
                FiveXFiveUser.first_name,
                FiveXFiveUser.last_name,
                FiveXFiveEmails.email,
                FiveXFivePhones.number
            )
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
            .join(FirstNameAlias, FirstNameAlias.id == FiveXFiveUser.first_name_id)
            .join(LastNameAlias, LastNameAlias.id == FiveXFiveUser.last_name_id)
            .outerjoin(FiveXFiveUsersEmails, FiveXFiveUsersEmails.user_id == FiveXFiveUser.id)
            .outerjoin(FiveXFiveEmails, FiveXFiveEmails.id == FiveXFiveUsersEmails.email_id)
            .outerjoin(FiveXFiveUsersPhones, FiveXFiveUsersPhones.user_id == FiveXFiveUser.id)
            .outerjoin(FiveXFivePhones, FiveXFivePhones.id == FiveXFiveUsersPhones.phone_id)
            .filter(
                LeadUser.domain_id == domain_id,
            ).group_by(FiveXFiveUser.first_name, FiveXFiveUser.last_name, FiveXFiveEmails.email, FiveXFivePhones.number,
                       LeadUser.five_x_five_user_id)
        )
        email_host = start_letter.split('@')
        if len(email_host) == 2:
            email_host = email_host[1]
        filters = [
            FiveXFiveEmails.email.ilike(f'{start_letter}%'),
            FiveXFiveEmails.email_host.ilike(f'{email_host}%'),
            FiveXFivePhones.number.ilike(f"{start_letter.replace('+', '')}%")
        ]
        if len(letters) == 1:
            filters.extend([
                FirstNameAlias.name.ilike(f'{letters[0].strip()}%'),
                LastNameAlias.name.ilike(f'{letters[0].strip()}%')
            ])
        elif len(letters) == 2:
            name_filter = and_(
                FirstNameAlias.name.ilike(f'{letters[0].strip()}%'),
                LastNameAlias.name.ilike(f'{letters[1].strip()}%')
            )
            filters.append(name_filter)
        query = query.filter(or_(*filters))
        leads = query.all()
        return leads
    

    def search_location(self, start_letter, dommain_id):
        query = (
            self.db.query(
                FiveXFiveLocations.city,
                States.state_name
            )
            .join(FiveXFiveUsersLocations, FiveXFiveUsersLocations.location_id == FiveXFiveLocations.id)
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUsersLocations.five_x_five_user_id)
            .outerjoin(States, States.id == FiveXFiveLocations.state_id)
            .filter(
                LeadUser.domain_id == dommain_id,
                or_(
                    FiveXFiveLocations.city.ilike(f'{start_letter}%'),
                    States.state_name.ilike(f'{start_letter}%')
                )
            )
            .group_by(FiveXFiveLocations.id, States.state_name)
            .limit(10)
        )
        locations = query.all()
        return locations

    def get_lead_user_by_up_id(self, domain_id, up_id):
        return self.db.query(LeadUser).join(FiveXFiveUser, FiveXFiveUser.id == LeadUser.five_x_five_user_id).filter(FiveXFiveUser.up_id == up_id, LeadUser.domain_id == domain_id).first()
    
    def get_first_visited_url(self, lead_user):
        result = self.db.query(LeadsRequests)\
            .join(LeadUser, LeadUser.first_visit_id == LeadsRequests.visit_id)\
            .filter(LeadUser.id == lead_user.id).first()
        return result.page
    

    def add_unlocked_user(self, user_id, domain_id, five_x_five_id):
        five_x_five_up_id = self.db.query(FiveXFiveUser.up_id).filter(
            FiveXFiveUser.id == five_x_five_id
        ).scalar()
        
        user = UsersUnlockedFiveXFiveUser(
            domain_id=domain_id,
            user_id=user_id,
            amount_credits=1,
            five_x_five_up_id=five_x_five_up_id
        )

        self.db.add(user)
        self.db.commit()