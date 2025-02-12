import csv
import io
from utils import format_phone_number
from persistence.company_persistence import CompanyPersistence
from datetime import datetime, timedelta


class CompanyService:
    def __init__(self, company_persistence_service: CompanyPersistence, domain):
        self.company_persistence_service = company_persistence_service
        self.domain = domain

    def format_phone_number(self, phones):
        phone_list = phones.split(',')
        formatted_phones = []
        for phone in phone_list:
            phone_str = phone.strip()
            if phone_str.endswith(".0"):
                phone_str = phone_str[:-2]
            if not phone_str.startswith("+"):
                phone_str = f"+{phone_str}"
            formatted_phones.append(phone_str)

        return ', '.join(formatted_phones)


    def convert_state_code_to_name(self, state_code, state_dict):
        if state_code:
            return state_dict.get(state_code.lower(), None)
        return None


    def get_companies(self, page, per_page, from_date, to_date, regions, sort_by, sort_order,
                      search_query, timezone_offset, employees_range, employee_visits, revenue_range, industry):
        companies, count, max_page = self.company_persistence_service.filter_companies(
            domain_id=self.domain.id,
            page=page,
            per_page=per_page,
            from_date=from_date,
            to_date=to_date,
            regions=regions,
            sort_by=sort_by,
            sort_order=sort_order,
            employees_range=employees_range,
            employee_visits=employee_visits,
            revenue_range=revenue_range,
            industry=industry,
            search_query=search_query,
        )

        company_list = []
        for company in companies:
            first_visited_date = company[5].strftime('%d.%m.%Y') if company[5] else None
            first_visited_time = company[6].strftime('%H:%M')
            combined_datetime = datetime.strptime(f"{first_visited_date} {first_visited_time}", '%d.%m.%Y %H:%M')
            adjusted_datetime = combined_datetime + timedelta(hours=timezone_offset)
            adjusted_date = adjusted_datetime.strftime('%d.%m.%Y')
            adjusted_time = adjusted_datetime.strftime('%H:%M')


            company_list.append({
                'id': company[0],
                'name': company[1],
                'phone': self.format_phone_number(company[2]) if company[2] else None,
                'linkedin_url': company[3],
                'employees_visited': company[4],
                'visited_date': adjusted_date,
                'company_revenue': company[7],
                'employee_count': company[8],
                'location': company[9],
                'industry': company[10],
                'domain': company[11],
                'zipcode': company[12],
                'description': company[13],
                'city': company[14],
                'state': company[15]
            })

        return company_list, count, max_page
    

    def get_employees(self, company_id, page, per_page, sort_by, sort_order,
                      search_query, job_title, seniority, regions, department):
        employees, count, max_page = self.company_persistence_service.filter_employees(
            domain_id=self.domain.id,
            company_id=company_id,
            domain_id=self.domain.id,
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            department=department,
            job_title=job_title,
            seniority=seniority,
            regions=regions,
            search_query=search_query,
        )

        employees_list = []
        for employee in employees:

            employees_list.append({
                'id': employee[0],
                'first_name': employee[1],
                'last_name': employee[2],
                'mobile_phone': self.format_phone_number(employee[3]) if employee[3] else None,
                'linkedin_url': employee[4],
                'personal_email': employee[5],
                'business_email': employee[6],
                'seniority': employee[7],
                'department': employee[8],
                'job_title': employee[9],
                'city': employee[10],
                'state': employee[11]
            })

        return employees_list, count, max_page
    

    def get_full_information_employee(self, company_id, employee_id):
        employees = self.company_persistence_service.get_full_information_employee(
            company_id=company_id,
            employee_id=employee_id,
            domain_id=self.domain.id,
        )

        employee = employees[0]
        employee_data = {
            'id': employee[0],
            'first_name': employee[1],
            'last_name': employee[2],
            'mobile_phone': self.format_phone_number(employee[3]) if employee[3] else None,
            'linkedin_url': employee[4],
            'personal_email': employee[5],
            'business_email': employee[6],
            'seniority': employee[7],
            'department': employee[8],
            'job_title': employee[9],
            'city': employee[10],
            'state': employee[11],
            'company_name': employee[12],
            'company_city': employee[13],
            'company_phone': employee[14],
            'company_description': employee[15],
            'company_address': employee[16],
            'company_zip': employee[17],
            'company_linkedin_url': employee[18],
            'business_email_last_seen': employee[19],
            'personal_emails_last_seen': employee[20],
            'personal_zip': employee[21],
            'company_last_updated': employee[22],
            'company_domain': employee[23],
            'personal_address': employee[24],
            'other_personal_emails': employee[25],
            'company_state': employee[26]
        }

        return employee_data


    def search_company(self, start_letter):
        start_letter = start_letter.replace('+', '').strip().lower()

        if start_letter.isdecimal():
            start_letter = start_letter.replace(' ', '')

        companies_data = self.company_persistence_service.search_company(
            start_letter=start_letter,
            domain_id=self.domain.id
        )

        results = set()
        for company in companies_data:
            if start_letter.isdecimal():
                results.add(company.phone)
            else:
                if start_letter in company.name.lower():
                    results.add(company.name)

        return list(results)[:10]


    def search_location(self, start_letter):
        location_data = self.company_persistence_service.search_location(start_letter=start_letter,
                                                                       domain_id=self.domain.id)
        results_set = set()

        for location in location_data:
            results_hash = {
                'city': location[0].title(),
                'state': location[1]
            }

            results_set.add(frozenset(results_hash.items()))
        results = [dict(item) for item in results_set]
        limited_results = list(results)[:10]
        return limited_results


    def get_uniq_primary_industry(self):
        industry = self.company_persistence_service.get_unique_primary_industries(domain_id=self.domain.id)
        return industry
    

    def get_uniq_primary__departments(self, company_id):
        departments = self.company_persistence_service.get_unique_primary__departments(company_id)
        return departments


    def get_uniq_primary__seniorities(self, company_id):
        seniorities = self.company_persistence_service.get_unique_primary__seniorities(company_id)
        return seniorities


    def get_uniq_primary__job_titles(self, company_id):
        job_titles = self.company_persistence_service.get_unique_primary__job_titles(company_id)
        return job_titles
    

    def download_employees(self, from_date=None, to_date=None, regions=None, search_query=None, companies_ids=0, timezone_offset=None):
        if companies_ids == 0:
            leads = self.company_persistence_service.get_full_information_companies_by_filters(domain_id=self.domain.id,
                                                                                from_date=from_date,
                                                                                to_date=to_date,
                                                                                regions=regions,
                                                                                search_query=search_query,
                                                                                timezone_offset=timezone_offset
                                                                                )
        else:
            leads = self.company_persistence_service.get_full_companies_by_ids(self.domain.id, companies_ids)
        if len(leads) == 0:
            return None
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'Company name', 'Company phone', 'Company LinkedIn URL', 'Number of employees', 
            'First visit date', 'Company revenue', 'Company employee count', 'Company address', 
            'Primary industry', 'Company domain', 'Company zip', 'Company description', 
            'City', 'State', 'Last company update'
        ])
        for lead in leads:
            relevant_data = [
                lead.name or 'None',
                format_phone_number(lead.phone) or 'None',
                lead.linkedin_url or 'None',
                lead.number_of_employees or 'None',
                lead.visited_date or 'None',
                lead.revenue or 'None',
                lead.employee_count or 'None',
                lead.address or 'None',
                lead.primary_industry or 'None',
                lead.domain or 'None',
                lead.zip or 'None',
                lead.description or 'None',
                lead.city or 'None',
                lead.state_name or 'None',
                lead.last_updated or 'None',
            ]
            writer.writerow(relevant_data)

        output.seek(0)
        return output
    
    
    def download_companies(self, from_date=None, to_date=None, regions=None, search_query=None, companies_ids=0, timezone_offset=None):
        if companies_ids == 0:
            leads = self.company_persistence_service.get_full_information_companies_by_filters(domain_id=self.domain.id,
                                                                                from_date=from_date,
                                                                                to_date=to_date,
                                                                                regions=regions,
                                                                                search_query=search_query,
                                                                                timezone_offset=timezone_offset
                                                                                )
        else:
            leads = self.company_persistence_service.get_full_companies_by_ids(self.domain.id, companies_ids)
        if len(leads) == 0:
            return None
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'Company name', 'Company phone', 'Company LinkedIn URL', 'Number of employees', 
            'First visit date', 'Company revenue', 'Company employee count', 'Company address', 
            'Primary industry', 'Company domain', 'Company zip', 'Company description', 
            'City', 'State', 'Last company update'
        ])
        for lead in leads:
            relevant_data = [
                lead.name or 'None',
                format_phone_number(lead.phone) or 'None',
                lead.linkedin_url or 'None',
                lead.number_of_employees or 'None',
                lead.visited_date or 'None',
                lead.revenue or 'None',
                lead.employee_count or 'None',
                lead.address or 'None',
                lead.primary_industry or 'None',
                lead.domain or 'None',
                lead.zip or 'None',
                lead.description or 'None',
                lead.city or 'None',
                lead.state_name or 'None',
                lead.last_updated or 'None',
            ]
            writer.writerow(relevant_data)

        output.seek(0)
        return output