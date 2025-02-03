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
                      search_query, timezone_offset):
        companies, count, max_page = self.company_persistence_service.filter_companies(
            domain_id=self.domain.id,
            page=page,
            per_page=per_page,
            from_date=from_date,
            to_date=to_date,
            regions=regions,
            sort_by=sort_by,
            sort_order=sort_order,
            search_query=search_query,
            timezone_offset=timezone_offset
        )

        company_list = []
        for company in companies:
            first_visited_date = company[5].strftime('%d.%m.%Y') if company[5] else None

            company_list.append({
                'id': company[0],
                'name': company[1],
                'phone': self.format_phone_number(company[2]) if company[2] else None,
                'linkedin_url': company[3],
                'employees_visited': company[4],
                'visited_date': first_visited_date,
                'company_revenue': company[6],
                'employee_count': company[7],
                'location': company[8],
                'industry': company[9],
                'domain': company[10],
                'zipcode': company[11],
                'description': company[12],
                'city': company[13],
                'state': company[14],
            })

        return company_list, count, max_page

    def search_contact(self, start_letter):
        start_letter = start_letter.replace('+', '').strip().lower()
        if start_letter.split()[0].isdecimal():
            start_letter = start_letter.replace(' ', '')
        leads_data = self.company_persistence_service.search_contact(start_letter=start_letter, domain_id=self.domain.id)
        results = set()
        for lead in leads_data:
            if start_letter.isdecimal():
                results.add(lead.number)
            else:
                if start_letter in (f"{lead.first_name} {lead.last_name}").lower():
                    results.add(f"{lead.first_name} {lead.last_name}")
                if lead.email and start_letter in (lead.email).lower():
                    results.add(lead.email)
        limited_results = list(results)[:10]
        return limited_results

    def search_location(self, start_letter):
        location_data = self.company_persistence_service.search_location(start_letter=start_letter,
                                                                       dommain_id=self.domain.id)
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
