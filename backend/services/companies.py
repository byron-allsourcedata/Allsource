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
        if phones:
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
        else:
            return None



    def convert_state_code_to_name(self, state_code, state_dict):
        if state_code:
            return state_dict.get(state_code.lower(), None)
        return None
    
    def get_field_with_status(self, field_value, is_unlocked):
        if field_value is None:
            return {"value": None, "visibility_status": "missing"}
        if not is_unlocked:
            return {"value": None, "visibility_status": "hidden"}
        return {"value": field_value, "visibility_status": "visible"}


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


    def get_employee_by_id(self, company_id, employee_id):
        employees, states = self.company_persistence_service.get_employee_by_id(
            domain_id=self.domain.id,
            employee_id=employee_id,
            company_id=company_id,
        )

        state_dict = {state.state_code: state.state_name for state in states} if states else {}

        employee = employees[0]

        employee_data = {
            'id': {"value": employee[0], "visibility_status": "visible"},
            'first_name': {"value": employee[1], "visibility_status": "visible"},
            'last_name': {"value": employee[2], "visibility_status": "visible"},
            'mobile_phone': {"value": self.format_phone_number(employee[3]), "visibility_status": "visible"},
            'linkedin_url': {"value": employee[4], "visibility_status": "visible"},
            'personal_email': {"value": employee[5], "visibility_status": "visible"},
            'business_email': {"value": employee[6], "visibility_status": "visible"},
            'seniority': {"value": employee[7], "visibility_status": "visible"},
            'department': {"value": employee[8], "visibility_status": "visible"},
            'job_title': {"value": employee[9], "visibility_status": "visible"},
            'city': {"value": employee[10], "visibility_status": "visible"},
            'state': {"value": self.convert_state_code_to_name(employee[11], state_dict), "visibility_status": "visible"},
            'is_unlocked': {"value": True, "visibility_status": "visible"}
        }

        return employee_data

    def get_employees(self, company_id, sort_by, sort_order,
                      search_query, job_title, seniority, regions, department, page, per_page=None):
        employees, count, max_page, states = self.company_persistence_service.filter_employees(
            domain_id=self.domain.id,
            company_id=company_id,
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
        state_dict = {state.state_code: state.state_name for state in states} if states else {}
        for employee in employees:

            employees_list.append({
                'id': {"value": employee[0], "visibility_status": "visible"},
                'first_name': {"value": employee[1], "visibility_status": "visible"},
                'last_name': {"value": employee[2], "visibility_status": "visible"},
                'mobile_phone': self.get_field_with_status(self.format_phone_number(employee[3]), employee[12]),
                'linkedin_url': self.get_field_with_status(employee[4], employee[12]),
                'personal_email': self.get_field_with_status(employee[5], employee[12]),
                'business_email': self.get_field_with_status(employee[6], employee[12]),
                'seniority': {"value": employee[7], "visibility_status": "visible"},
                'department': {"value": employee[8], "visibility_status": "visible"},
                'job_title': {"value": employee[9], "visibility_status": "visible"},
                'city': {"value": employee[10], "visibility_status": "visible"},
                'state': {"value": self.convert_state_code_to_name(employee[11], state_dict), "visibility_status": "visible"},
                'is_unlocked': {"value": employee[12], "visibility_status": "visible"}
            })

        return employees_list, count, max_page
    

    def get_full_information_employee(self, company_id, employee_id):
        employees, states = self.company_persistence_service.get_full_information_employee(
            company_id=company_id,
            employee_id=employee_id,
            domain_id=self.domain.id,
        )

        employee = employees[0]
        state_dict = {state.state_code: state.state_name for state in states} if states else {}
        employee_data = {
            'id': {"value": employee[0], "visibility_status": "visible"},
            'first_name': {"value": employee[1], "visibility_status": "visible"},
            'last_name': {"value": employee[2], "visibility_status": "visible"},
            'mobile_phone': self.get_field_with_status(self.format_phone_number(employee[3]), employee[27]),
            'linkedin_url': self.get_field_with_status(employee[4], employee[27]),
            'personal_email': self.get_field_with_status(employee[5], employee[27]),
            'business_email': self.get_field_with_status(employee[6], employee[27]),
            'seniority': {"value": employee[7], "visibility_status": "visible"},
            'department': {"value": employee[8], "visibility_status": "visible"},
            'job_title': {"value": employee[9], "visibility_status": "visible"},
            'city': {"value": employee[10], "visibility_status": "visible"},
            'state': {"value": employee[11], "visibility_status": "visible"},
            'company_name': {"value": employee[12], "visibility_status": "visible"},
            'company_city': {"value": employee[13], "visibility_status": "visible"},
            'company_phone': {"value": employee[14], "visibility_status": "visible"},
            'company_description': {"value": employee[15], "visibility_status": "visible"},
            'company_address': {"value": employee[16], "visibility_status": "visible"},
            'company_zip': {"value": employee[17], "visibility_status": "visible"},
            'company_linkedin_url': {"value": employee[18], "visibility_status": "visible"},
            'business_email_last_seen': self.get_field_with_status(employee[19], employee[27]),
            'personal_emails_last_seen': self.get_field_with_status(employee[20], employee[27]),
            'personal_zip': self.get_field_with_status(employee[21], employee[27]),
            'company_last_updated': {"value": employee[22], "visibility_status": "visible"},
            'company_domain': {"value": employee[23], "visibility_status": "visible"},
            'personal_address': self.get_field_with_status(employee[24], employee[27]),
            'other_personal_emails': self.get_field_with_status(employee[25], employee[27]),
            'company_state': {"value": self.convert_state_code_to_name(employee[26], state_dict), "visibility_status": "visible"},
            'is_unlocked': {"value": employee[27], "visibility_status": "visible"}
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
    

    def download_employees(self, sort_by, sort_order, regions, search_query, job_title, seniority, department, company_id):
        employees_list, _, _ = self.get_employees(
            company_id=company_id,
            sort_by=sort_by,
            sort_order=sort_order,
            department=department,
            job_title=job_title,
            seniority=seniority,
            regions=regions,
            search_query=search_query,
            page=1
        )

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'First name', 'Last name', 'Mobile phone', 'Linkedin url', 'Personal email', 'Business email', 'Seniority', 'Department', 'Job title', 'City', 'State'
        ])
        for employee in employees_list:
            writer.writerow([
                self.process_field(employee.get('first_name')),
                self.process_field(employee.get('last_name')),
                self.process_field(employee.get('mobile_phone')),
                self.process_field(employee.get('linkedin_url')),
                self.process_field(employee.get('personal_email')),
                self.process_field(employee.get('business_email')),
                self.process_field(employee.get('seniority')),
                self.process_field(employee.get('department')),
                self.process_field(employee.get('job_title')),
                self.process_field(employee.get('city')),
                self.process_field(employee.get('state')),
            ])

        output.seek(0)
        return output


    def process_field(self, field):
        formatted_str = ""
        status = field.get("visibility_status")
        value = field.get("value")
        if status == "visible":
            return value.capitalize() if isinstance(value, str) and '@' not in value else value
        return formatted_str


    def download_employee(self, employee_id, company_id):
        employee = self.get_full_information_employee(
            company_id=company_id,
            employee_id=employee_id
        )

        headers_mapping = [
            ('First name', 'first_name'),
            ('Last name', 'last_name'),
            ('Mobile phone', 'mobile_phone'),
            ('Linkedin url', 'linkedin_url'),
            ('Personal email', 'personal_email'),
            ('Business email', 'business_email'),
            ('Seniority', 'seniority'),
            ('Department', 'department'),
            ('Job title', 'job_title'),
            ('City', 'city'),
            ('State', 'state'),
            ('Company name', 'company_name'),
            ('Company city', 'company_city'),
            ('Company description', 'company_description'),
            ('Company address', 'company_address'),
            ('Company zip', 'company_zip'),
            ('Company linkedin url', 'company_linkedin_url'),
            ('Business email last seen', 'business_email_last_seen'),
            ('Personal email last seen', 'personal_emails_last_seen'),
            ('Personal zip', 'personal_zip'),
            ('Company last updated', 'company_last_updated'),
            ('Company domain', 'company_domain'),
            ('Personal address', 'personal_address'),
            ('Other personal emails', 'other_personal_emails'),
            ('Company state', 'company_state'),
        ]

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Column', 'Value'])

        for header, key in headers_mapping:
            field = employee.get(key, {"value": None, "visibility_status": "missing"})
            value = field.get("value")
            status = field.get("visibility_status", "missing")
            formatted_value = ""
            
            if status == "visible":
                formatted_value = value.capitalize() if isinstance(value, str) and '@' not in value else value

            writer.writerow([header, formatted_value])

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