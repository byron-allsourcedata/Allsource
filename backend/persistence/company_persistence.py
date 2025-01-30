import logging
import math
from datetime import datetime, timedelta

import pytz
from sqlalchemy import and_, or_, desc, asc, Integer, cast, VARCHAR
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


def normalize_profession(profession: str) -> str:
    return profession.lower().replace(" ", "-")


class CompanyPersistence:
    def __init__(self, db: Session):
        self.db = db

    def filter_companies(self, domain_id, page, per_page, from_date, to_date, regions,  sort_by, sort_order,
                         search_query, timezone_offset):

        FirstNameAlias = aliased(FiveXFiveNames)
        LastNameAlias = aliased(FiveXFiveNames)

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
                .outerjoin(FiveXFiveLocations, FiveXFiveLocations.id == LeadCompany.five_x_five_location_id)  # Соединяем таблицу FiveXFiveLocations
                .outerjoin(States, States.id == FiveXFiveLocations.state_id)  # Соединяем таблицу States по state_code
                .filter(LeadUser.domain_id == domain_id)
                .group_by(LeadCompany.id, first_visit_subquery.c.visited_date, FiveXFiveLocations.city, States.state_name)
                .order_by(asc(LeadCompany.name), desc(first_visit_subquery.c.visited_date))
        )

        sort_options = {
            'name': FiveXFiveUser.first_name,
            'business_email': FiveXFiveUser.business_email,
            'personal_email': FiveXFiveUser.personal_emails,
            'mobile_phone': FiveXFiveUser.mobile_phone,
            'gender': FiveXFiveUser.gender,
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

