import logging
import math
from datetime import datetime, timedelta

import pytz
from urllib.parse import unquote
from sqlalchemy import and_, or_, desc, asc, Integer, cast, VARCHAR, case
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import func
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_locations import FiveXFiveLocations
from models.five_x_five_names import FiveXFiveNames
from models.five_x_five_phones import FiveXFivePhones
from models.five_x_five_users import FiveXFiveUser
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.five_x_five_users_locations import FiveXFiveUsersLocations
from models.five_x_five_users_phones import FiveXFiveUsersPhones
from models.leads import Lead
from models.leads_users import LeadUser
from models.leads_users_added_to_cart import LeadsUsersAddedToCart
from models.leads_users_ordered import LeadsUsersOrdered
from models.leads_visits import LeadsVisits
from models.state import States
from models.lead_company import LeadCompany


logger = logging.getLogger(__name__)

class CompanyPersistence:
    def __init__(self, db: Session):
        self.db = db
        
    def get_full_information_companies_by_filters(self, domain_id, from_date, to_date, regions, search_query, timezone_offset):
        first_visit_subquery = (
            self.db.query(
                LeadUser.company_id,
                func.min(LeadsVisits.start_date).label("visited_date")
            )
                .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
                .group_by(LeadUser.company_id)
                .subquery()
        )

        query = (
            self.db.query(
                LeadCompany.id,
                LeadCompany.name,
                LeadCompany.phone,
                LeadCompany.linkedin_url,
                func.count(LeadUser.id).label("number_of_employees"),
                first_visit_subquery.c.visited_date,
                LeadCompany.revenue,
                LeadCompany.employee_count,
                LeadCompany.address,
                LeadCompany.primary_industry,
                LeadCompany.domain,
                LeadCompany.zip,
                LeadCompany.description,
                FiveXFiveLocations.city,
                States.state_name,
                LeadCompany.last_updated,
            )
                .join(LeadUser, LeadUser.company_id == LeadCompany.id)
                .outerjoin(first_visit_subquery, first_visit_subquery.c.company_id == LeadCompany.id)
                .outerjoin(FiveXFiveLocations, FiveXFiveLocations.id == LeadCompany.five_x_five_location_id)
                .outerjoin(States, States.id == FiveXFiveLocations.state_id)
                .filter(LeadUser.domain_id == domain_id)
                .group_by(LeadCompany.id, first_visit_subquery.c.visited_date, FiveXFiveLocations.city, States.state_name)
                .order_by(asc(LeadCompany.name), desc(first_visit_subquery.c.visited_date))
        )

        sort_options = {
            'company_name': FiveXFiveUser.first_name,
            'phone_name': FiveXFiveUser.business_email,
            'linkedln': FiveXFiveUser.personal_emails,
            'empl': FiveXFiveUser.mobile_phone,
            'gender': FiveXFiveUser.gender,
            'state': FiveXFiveLocations.state_id,
            'city': FiveXFiveLocations.city,
            'age': FiveXFiveUser.age_min,
            'average_time_sec': LeadUser.avarage_visit_time,
            'status': LeadUser.is_returning_visitor,
            'funnel': LeadUser.behavior_type,
        }
        
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

        if regions:
            filters = []
            region_list = regions.split(',')
            for region_data in region_list:
                region_data = region_data.split('-')
                filters.append(FiveXFiveLocations.city.ilike(f'{region_data[0]}%'))

                if len(region_data) > 1 and region_data[1]:
                    filters.append(States.state_name.ilike(f'{region_data[1]}%'))

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

            query = query.filter(or_(*filters))

        leads = query.limit(1000).all()
        return leads
    
    def get_full_companies_by_ids(self, domain_id, companies_ids):
        first_visit_subquery = (
            self.db.query(
                LeadUser.company_id,
                func.min(LeadsVisits.start_date).label("visited_date")
            )
                .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
                .group_by(LeadUser.company_id)
                .subquery()
        )

        query = (
            self.db.query(
                LeadCompany.id,
                LeadCompany.name,
                LeadCompany.phone,
                LeadCompany.linkedin_url,
                func.count(LeadUser.id).label("number_of_employees"),
                first_visit_subquery.c.visited_date,
                LeadCompany.revenue,
                LeadCompany.employee_count,
                LeadCompany.address,
                LeadCompany.primary_industry,
                LeadCompany.domain,
                LeadCompany.zip,
                LeadCompany.description,
                FiveXFiveLocations.city,
                States.state_name,
                LeadCompany.last_updated,
            )
                .join(LeadUser, LeadUser.company_id == LeadCompany.id)
                .outerjoin(first_visit_subquery, first_visit_subquery.c.company_id == LeadCompany.id)
                .outerjoin(FiveXFiveLocations, FiveXFiveLocations.id == LeadCompany.five_x_five_location_id)
                .outerjoin(States, States.id == FiveXFiveLocations.state_id)
                .filter(LeadUser.domain_id == domain_id)
                .group_by(LeadCompany.id, first_visit_subquery.c.visited_date, FiveXFiveLocations.city, States.state_name)
                .order_by(asc(LeadCompany.name), desc(first_visit_subquery.c.visited_date))
                .filter(LeadCompany.id.in_(companies_ids))
        )

        leads = query.all()
        return leads

    def filter_companies(self, domain_id, page, per_page, from_date, to_date, regions, sort_by, sort_order,
                         search_query, employees_range, employee_visits, revenue_range, industry):
        FirstLeadUser = aliased(LeadUser)

        query = (
            self.db.query(
                LeadCompany.id,
                LeadCompany.name,
                LeadCompany.phone,
                LeadCompany.linkedin_url,
                func.count(LeadUser.id).label("number_of_employees"),
                LeadsVisits.start_date.label("visited_date"),
                LeadsVisits.start_time.label("visited_time"),
                LeadCompany.revenue,
                LeadCompany.employee_count,
                LeadCompany.address,
                LeadCompany.primary_industry,
                LeadCompany.domain,
                LeadCompany.zip,
                LeadCompany.description,
                FiveXFiveLocations.city,
                States.state_name,
                LeadCompany.last_updated,
                LeadCompany.alias,
            )
                .join(LeadUser, LeadUser.company_id == LeadCompany.id)
                .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
                .outerjoin(FiveXFiveLocations, FiveXFiveLocations.id == LeadCompany.five_x_five_location_id)
                .outerjoin(States, States.id == FiveXFiveLocations.state_id)
                .filter(LeadUser.domain_id == domain_id)
                .group_by(
                LeadCompany.id,
                LeadsVisits.start_date,
                LeadsVisits.start_time,
                FiveXFiveLocations.city,
                States.state_name
            )
                .order_by(asc(LeadCompany.name), desc(LeadsVisits.start_date))
        )

        employees_case = case(
            (LeadCompany.employee_count == "1 to 10", 1),
            (LeadCompany.employee_count == "11 to 25", 11),
            (LeadCompany.employee_count == "26 to 50", 26),
            (LeadCompany.employee_count == "51 to 100", 51),
            (LeadCompany.employee_count == "101 to 250", 101),
            (LeadCompany.employee_count == "251 to 500", 251),
            (LeadCompany.employee_count == "501 to 1000", 501),
            (LeadCompany.employee_count == "1001 to 5000", 1001),
            (LeadCompany.employee_count == "5001 to 10000", 5001),
            (LeadCompany.employee_count == "10000+", 10000),
            else_=None
        )

        revenue_case = case(
            (LeadCompany.revenue == "Under 1 Million", 0),
            (LeadCompany.revenue == "1 Million to 5 Million", 1000000),
            (LeadCompany.revenue == "5 Million to 10 Million", 5000000),
            (LeadCompany.revenue == "10 Million to 25 Million", 10000000),
            (LeadCompany.revenue == "25 Million to 50 Million", 25000000),
            (LeadCompany.revenue == "50 Million to 100 Million", 50000000),
            (LeadCompany.revenue == "100 Million to 250 Million", 100000000),
            (LeadCompany.revenue == "250 Million to 500 Million", 250000000),
            (LeadCompany.revenue == "500 Million to 1 Billion", 500000000),
            (LeadCompany.revenue == "1 Billion and Over", 1000000000),
            else_=None
        )

        sort_options = {
            'company_name': LeadCompany.name,
            'employees_visited': func.count(LeadUser.id).label("number_of_employees"),
            'visited_date': LeadsVisits.start_date,
            'revenue': revenue_case,
            'number_of_employees': employees_case,
        }

        if sort_by in sort_options:
            sort_column = sort_options[sort_by]

            query = query.order_by(None)

            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))


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

        if industry:
            industries = [unquote(i.strip()) for i in industry.split(',')]
            query = query.filter(LeadCompany.primary_industry.in_(industries))

        if employees_range:
            employees_map = {
                "1-10": "1 to 10",
                "11-25": "11 to 25",
                "26-50": "26 to 50",
                "51-100": "51 to 100",
                "101-250": "101 to 250",
                "251-500": "251 to 500",
                "501-1000": "501 to 1000",
                "1001-5000": "1001 to 5000",
                "2001-5000": "2001 to 5000",
                "5001-10000": "5001 to 10000",
                "10000+": "10000+",
            }

            employees = [employees_map.get(unquote(i.strip()), None) for i in employees_range.split(',')]
            employees_list = [e for e in employees if e]

            filters = []

            if employees_list:
                filters.append(LeadCompany.employee_count.in_(employees_list))

            if "unknown" in employees_range:
                filters.append(LeadCompany.employee_count.is_(None))

            if filters:
                query = query.filter(or_(*filters))

        if revenue_range:
            revenue_map = {
                "Under 1M": "Under 1 Million",
                "$1M - $5M": "1 Million to 5 Million",
                "$5M - $10M": "5 Million to 10 Million",
                "$10M - $25M": "10 Million to 25 Million",
                "$25M - $50M": "25 Million to 50 Million",
                "$50M - $100M": "50 Million to 100 Million",
                "$100M - $250M": "100 Million to 250 Million",
                "$250M - $500M": "250 Million to 500 Million",
                "$500M - $1B": "500 Million to 1 Billion",
                "$1 Billion +": "1 Billion and Over",
            }

            revenue = [revenue_map.get(unquote(i.strip()), None) for i in revenue_range.split(',')]

            revenue_list = [e for e in revenue if e]

            filters = []

            if revenue_list:
                filters.append(LeadCompany.revenue.in_(revenue_list))

            if "unknown" in revenue_range:
                filters.append(LeadCompany.revenue.is_(None))

            if filters:
                query = query.filter(or_(*filters))

        if employee_visits:
            min_visits = int(employee_visits.rstrip('+'))
            if employee_visits == '+5':
                query = query.having(func.count(LeadUser.id) >= min_visits)
            else:
                query = query.having(func.count(LeadUser.id) == min_visits)

        if regions:
            filters = []
            region_list = regions.split(',')
            for region_data in region_list:
                region_data = region_data.split('-')
                filters.append(FiveXFiveLocations.city.ilike(f'{region_data[0]}%'))

                if len(region_data) > 1 and region_data[1]:
                    filters.append(States.state_name.ilike(f'{region_data[1]}%'))

            query = query.filter(or_(*filters))

        if search_query:
            filters = [
                LeadCompany.name.ilike(f'{search_query}%'),
                LeadCompany.phone.ilike(f"{search_query.replace('+', '')}%"),
            ]

            query = query.filter(or_(*filters))

        offset = (page - 1) * per_page
        leads = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page)
        return leads, count, max_page


    def filter_employees(self, company_alias, page, per_page, sort_by, sort_order,
                         search_query, job_title, department, seniority, regions):
       
        FiveXFiveNamesFirst = aliased(FiveXFiveNames)
        FiveXFiveNamesLast = aliased(FiveXFiveNames)

        query = (
            self.db.query(
                FiveXFiveUser.id,
                FiveXFiveNamesFirst.name,
                FiveXFiveNamesLast.name,
                FiveXFiveUser.mobile_phone,
                FiveXFiveUser.linkedin_url,
                FiveXFiveUser.personal_emails,
                FiveXFiveUser.business_email,
                FiveXFiveUser.seniority_level,
                FiveXFiveUser.department,
                FiveXFiveUser.job_title,
                FiveXFiveLocations.city,
                States.state_name,
            )
                .outerjoin(FiveXFiveUsersLocations, FiveXFiveUsersLocations.five_x_five_user_id == FiveXFiveUser.id)
                .outerjoin(FiveXFiveLocations, FiveXFiveLocations.id == FiveXFiveUsersLocations.location_id)
                .outerjoin(States, States.id == FiveXFiveLocations.state_id)
                .outerjoin(FiveXFiveNamesFirst, FiveXFiveNamesFirst.id == FiveXFiveUser.first_name_id)
                .outerjoin(FiveXFiveNamesLast, FiveXFiveNamesLast.id == FiveXFiveUser.last_name_id)
                .filter(FiveXFiveUser.company_alias == company_alias)
        )

        sort_options = {
            'personal_email': FiveXFiveUser.personal_emails,
            'business_email': FiveXFiveUser.business_email,
        }

        if sort_by in sort_options:
            sort_column = sort_options[sort_by]

            query = query.order_by(None)

            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
        
        if job_title:
            job_titles = [unquote(i.strip()) for i in job_title.split(',')]
            query = query.filter(FiveXFiveUser.job_title.in_(job_titles))

        if department:
            departments = [unquote(i.strip()) for i in department.split(',')]
            query = query.filter(FiveXFiveUser.department.in_(departments))
        
        if seniority:
            seniorities = [unquote(i.strip()) for i in seniority.split(',')]
            query = query.filter(FiveXFiveUser.seniority_level.in_(seniorities))

        if regions:
            filters = []
            region_list = regions.split(',')
            for region_data in region_list:
                region_data = region_data.split('-')
                filters.append(FiveXFiveLocations.city.ilike(f'{region_data[0]}%'))

                if len(region_data) > 1 and region_data[1]:
                    filters.append(States.state_name.ilike(f'{region_data[1]}%'))

            query = query.filter(or_(*filters))

        if search_query:
            filters = [
                FiveXFiveUser.first_name.ilike(f'{search_query}%'),
                FiveXFiveUser.last_name.ilike(f'{search_query}%'),
                FiveXFiveUser.business_email.ilike(f'{search_query}%'),
                FiveXFiveUser.personal_emails.ilike(f'{search_query}%'),
                FiveXFiveUser.linkedin_url.ilike(f'{search_query}%'),
                FiveXFiveUser.mobile_phone.ilike(f"{search_query.replace('+', '')}%"),
            ]

            query = query.filter(or_(*filters))

        offset = (page - 1) * per_page
        employees = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page)
        return employees, count, max_page
    

    def search_company(self, start_letter, domain_id):
        query = (
            self.db.query(
                LeadCompany.name,
                LeadCompany.phone
            )
                .join(LeadUser, LeadUser.company_id == LeadCompany.id)
                .filter(
                LeadUser.domain_id == domain_id,
                or_(
                    LeadCompany.name.ilike(f'{start_letter}%'),
                    LeadCompany.phone.ilike(f"{start_letter.replace('+', '')}%")
                )
            )
                .limit(10)
        )

        companies = query.all()
        return companies

    def search_location(self, start_letter, domain_id):
        query = (
            self.db.query(
                FiveXFiveLocations.city,
                States.state_name
            )
                .join(LeadCompany,LeadCompany.five_x_five_location_id == FiveXFiveLocations.id)
                .join(LeadUser, LeadUser.company_id == LeadCompany.id)
                .outerjoin(States, States.id == FiveXFiveLocations.state_id)
                .filter(LeadUser.domain_id == domain_id,
                or_(
                    FiveXFiveLocations.city.ilike(f'{start_letter}%'),
                    States.state_name.ilike(f'{start_letter}%'),
                )
            )
                .group_by(FiveXFiveLocations.id, States.state_name)
                .limit(10)
        )
        locations = query.all()
        return locations

    def get_unique_primary_industries(self, domain_id):
        query = (
            self.db.query(LeadCompany.primary_industry)
                .join(LeadUser, LeadUser.company_id == LeadCompany.id)
                .filter(LeadUser.domain_id == domain_id, LeadCompany.primary_industry.isnot(None))
                .distinct()
                .order_by(LeadCompany.primary_industry)
        )
        industries = [row.primary_industry for row in query.all()]
        return industries
