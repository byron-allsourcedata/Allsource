import logging
import math
from datetime import datetime

import pytz
from sqlalchemy import and_, or_, desc, asc, Integer
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import func
from utils import format_phone_number
from models.audience import Audience
from models.audience_leads import AudienceLeads
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_locations import FiveXFiveLocations
from models.five_x_five_names import FiveXFiveNames
from models.five_x_five_phones import FiveXFivePhones
from models.five_x_five_users import FiveXFiveUser
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.five_x_five_users_locations import FiveXFiveUsersLocations
from models.five_x_five_users_phones import FiveXFiveUsersPhones
from models.leads import Lead
from models.leads_orders import LeadOrders
from models.leads_users import LeadUser
from models.leads_users_added_to_cart import LeadsUsersAddedToCart
from models.leads_users_ordered import LeadsUsersOrdered
from models.leads_visits import LeadsVisits
from models.state import States
from models.subscription_transactions import SubscriptionTransactions

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
                LeadUser.is_active
            )
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
            .join(FirstNameAlias, FirstNameAlias.id == FiveXFiveUser.first_name_id)
            .join(LastNameAlias, LastNameAlias.id == FiveXFiveUser.last_name_id)
            .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
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
                LeadUser.is_active
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
                    LeadsVisits.start_date >= start_date,
                    LeadsVisits.start_date <= end_date
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
                FiveXFivePhones.number.ilike(f'{search_query}%')
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
        count = query.count()
        max_page = math.ceil(count / per_page)
        states = None
        if leads:
            states = self.db.query(States).all()
        return leads, count, max_page, states

    def get_contact_data(self, domain_id, from_date, to_date):
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
        lead_users = (
            self.db.query(FiveXFiveUser)
            .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
            .filter(
                LeadUser.domain_id == domain_id,
                LeadUser.is_active == True,
                FiveXFiveUser.id.in_(leads_ids)
            )
            .all()
        )
        if lead_users:
            states = self.db.query(States).all()
        return lead_users, states

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
            .filter(LeadUser.domain_id == domain_id, LeadUser.is_active == True)
            .group_by(
                FiveXFiveUser.id,
                LeadsVisits.start_date
            )
        )
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
        if status:
            status_list = status.split(',')
            filters = []
            for status_data in status_list:
                if status_data == 'converted_sales':
                    filters.append(LeadUser.is_converted_sales == True)
                elif status_data == 'view_product':
                    filters.append(LeadUser.behavior_type == "viewed_product")
                elif status_data == 'visitor':
                    filters.append(LeadUser.behavior_type == "visitor")
                elif status_data == 'abandoned_cart':
                    query = (
                        query
                        .join(LeadsUsersAddedToCart, LeadsUsersAddedToCart.lead_user_id == LeadUser.id)
                        .outerjoin(LeadsUsersOrdered, LeadsUsersOrdered.lead_user_id == LeadUser.id)
                        .where(
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

        if average_time_spent:
            page_visits_list = average_time_spent.split(',')
            filters = []
            for visit in page_visits_list:
                if visit == 'under_10_secs':
                    filters.append(LeadsVisits.average_time_sec < 10)
                elif visit == '10-30_secs':
                    filters.append(LeadsVisits.average_time_sec >= 10 and LeadsVisits.average_time_sec <= 30)
                elif visit == '30-60_secs':
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

            filters = [
                FiveXFiveEmails.email.ilike(f'{search_query}%'),
                FiveXFiveEmails.email_host.ilike(f'{search_query}%'),
                FiveXFivePhones.number.ilike(f'{search_query}%')
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

        leads = query.limit(1000).all()
        if leads:
            states = self.db.query(States).all()
        return leads, states

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
        lead_users = self.db.query(LeadUser).filter_by(domain_id=domain_id).order_by(LeadUser.created_at.desc()).limit(3).all()
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
                FiveXFiveUser.last_name,
                FiveXFiveUser.personal_city,
                FiveXFiveUser.personal_state,
                FiveXFiveUser.company_name,
                FiveXFiveUser.company_domain,
                FiveXFiveUser.job_title,
                FiveXFiveUser.last_updated,
                FiveXFiveUser.age_min,
                FiveXFiveUser.age_max,
                FiveXFiveUser.personal_address,
                FiveXFiveUser.personal_address_2,
                FiveXFiveUser.personal_zip,
                FiveXFiveUser.personal_zip4,
                FiveXFiveUser.professional_zip,
                FiveXFiveUser.married,
                FiveXFiveUser.children,
                FiveXFiveUser.income_range,
                FiveXFiveUser.homeowner,
                FiveXFiveUser.dpv_code
            )
            .filter(FiveXFiveUser.id.in_(five_x_five_user_ids))
            .all()
        )

        result = [
            {
                column: (
                    format_phone_number(getattr(user, column, "N/A"))
                    if "phone" in column else
                    (getattr(user, column, "N/A").lower() if column == "gender" and getattr(user, column, None) else getattr(user, column, "N/A"))
                )
                for column in [
                    "id", "first_name", "mobile_phone", "direct_number", "gender", "personal_phone", 
                    "personal_emails", "last_name", "personal_city", "personal_state", "company_name", 
                    "company_domain", 
                    "job_title", "last_updated", "age_min", "age_max", 
                    "personal_address", "personal_address_2", "personal_zip", "personal_zip4", 
                    "professional_zip", "married", "children", "income_range", "homeowner", "dpv_code"
                ]
            }
            for user in five_x_five_users
        ]
        
        return result

        
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
            FiveXFivePhones.number.ilike(f'{start_letter}%')
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
    
