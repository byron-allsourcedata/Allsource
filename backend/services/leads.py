import csv
import io

from models.users import Users
from persistence.leads_persistence import LeadsPersistence


class LeadsService:
    def __init__(self, leads_persistence_service: LeadsPersistence, user):
        self.leads_persistence_service = leads_persistence_service
        self.user = user

    def get_leads(self, page, per_page, status, from_date, to_date, regions, page_visits, average_time_spent,
                  lead_funnel, emails, recurring_visits, sort_by, sort_order, search_query):
        leads, count, max_page = self.leads_persistence_service.filter_leads(self.user.get('id'), page, per_page, status,
                                                                             from_date, to_date,
                                                                             regions, page_visits, average_time_spent,
                                                                             lead_funnel, emails, recurring_visits,
                                                                             sort_by, sort_order, search_query)
        leads_list = [
            {
                'lead': lead,
                'status': status,
                'funnel': funnel,
                'state': state,
                'city': city,
                'time_spent': time_on_site,
                'last_visited_date': start_date.strftime('%d.%m.%Y') if start_date else 'N/A',
                'last_visited_time': start_time.strftime('%H:%M') if start_time else 'N/A'
            }
            for lead, status, funnel, state, city, start_date, start_time, time_on_site in leads
        ]

        return leads_list, count, max_page

    def download_leads(self, leads_ids):
        if len(leads_ids) == 0:
            return None
        leads_data = self.leads_persistence_service.get_full_user_leads_by_ids(self.user.get('id'), leads_ids)
        if len(leads_data) == 0:
            return None
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            ['First Name', 'Last Name', 'Gender', 'Mobile Phone', 'Company Name', 'Company City', 'Company State',
             'Company Zip', 'Business Email', 'Age min', 'Age_max', 'Company domain', 'Company phone', 'Company sic',
             'Company address', 'Company revenue', 'Company employee count'])
        for lead_data in leads_data:
            if lead_data:
                relevant_data = [
                    lead_data.first_name if lead_data.first_name is not None else 'None',
                    lead_data.last_name if lead_data.last_name is not None else 'None',
                    lead_data.gender if lead_data.gender is not None else 'None',
                    lead_data.mobile_phone if lead_data.mobile_phone is not None else 'None',
                    lead_data.company_name if lead_data.company_name is not None else 'None',
                    lead_data.company_city if lead_data.company_city is not None else 'None',
                    lead_data.company_state if lead_data.company_state is not None else 'None',
                    lead_data.company_zip if lead_data.company_zip is not None else 'None',
                    lead_data.business_email if lead_data.business_email is not None else 'None',
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

    def get_leads_for_build_an_audience(self, regions, professions, ages, genders, net_worths,
                                        interest_list, not_in_existing_lists, page, per_page):
        leads_data, count_leads, max_page = self.leads_persistence_service.filter_leads_for_build_audience(
            regions=regions, professions=professions, ages=ages, genders=genders, net_worths=net_worths,
            interest_list=interest_list, not_in_existing_lists=not_in_existing_lists, page=page, per_page=per_page)

        leads_list = [
            {
                'id': id,
                'name': f"{first_name} {last_name}",
                'email': business_email,
                'gender': gender,
                'age': f"{age_min} - {age_max}" if age_min is not None and age_max is not None else None,
                'occupation': job_title,
                'city': city,
                'state': state
            }
            for id, first_name, last_name, business_email, gender, age_min, age_max, job_title, city, state in
            leads_data
        ]
        return {
            'leads_list': leads_list,
            'count_leads': count_leads,
            'max_page': max_page,
        }
