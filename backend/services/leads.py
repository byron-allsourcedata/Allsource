import csv

from models.users import Users
from persistence.leads_persistence import LeadsPersistence
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


class LeadsService:
    def __init__(self, leads_persistence_service: LeadsPersistence, user: Users):
        self.leads_persistence_service = leads_persistence_service
        self.user = user

    def get_leads(self, page, per_page, status, from_date, to_date, regions, page_visits, average_time_spent,
                  lead_funnel, emails, recurring_visits):
        leads, count, max_page = self.leads_persistence_service.filter_leads(page, per_page, status, from_date, to_date,
                                                                             regions, page_visits, average_time_spent,
                                                                             lead_funnel, emails, recurring_visits)
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

    def download_leads(self, leads_ids):
        if len(leads_ids) == 0:
            return None
        leads_data = self.leads_persistence_service.get_full_user_leads_by_ids(self.user.id, leads_ids)
        if len(leads_data) == 0:
            return None
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            ['First Name', 'Last Name', 'Gender', 'Mobile Phone', 'IP', 'Company Name', 'Company City', 'Company State',
             'Company Zip', 'Business Email', 'Time spent', 'No of visits',
             'No of page visits', 'Age min', 'Age_max', 'Company domain', 'Company phone', 'Company sic',
             'Company address', 'Company revenue', 'Company employee count'])
        for lead_data in leads_data:
            if lead_data:
                relevant_data = [
                    lead_data.first_name if lead_data.first_name is not None else 'None',
                    lead_data.last_name if lead_data.last_name is not None else 'None',
                    lead_data.gender if lead_data.gender is not None else 'None',
                    lead_data.mobile_phone if lead_data.mobile_phone is not None else 'None',
                    lead_data.ip if lead_data.ip is not None else 'None',
                    lead_data.company_name if lead_data.company_name is not None else 'None',
                    lead_data.company_city if lead_data.company_city is not None else 'None',
                    lead_data.company_state if lead_data.company_state is not None else 'None',
                    lead_data.company_zip if lead_data.company_zip is not None else 'None',
                    lead_data.business_email if lead_data.business_email is not None else 'None',
                    lead_data.time_spent if lead_data.time_spent is not None else 'None',
                    lead_data.no_of_visits if lead_data.no_of_visits is not None else 'None',
                    lead_data.no_of_page_visits if lead_data.no_of_page_visits is not None else 'None',
                    lead_data.age_min if lead_data.age_min is not None else 'None',
                    lead_data.age_max if lead_data.age_max is not None else 'None',
                    lead_data.company_domain if lead_data.company_domain is not None else 'None',
                    lead_data.company_phone if lead_data.company_phone is not None else 'None',
                    lead_data.company_sic if lead_data.company_sic is not None else 'None',
                    lead_data.company_address if lead_data.company_address is not None else 'None',
                    lead_data.company_revenue if lead_data.company_revenue is not None else 'None',
                    lead_data.company_employee_count if lead_data.company_employee_count is not None else 'None',
                ]
                writer.writerow(relevant_data)

        output.seek(0)
        return output
