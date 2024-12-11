import csv
import io
from datetime import datetime, time
from models.users import Users
from persistence.leads_persistence import LeadsPersistence


class LeadsService:
    def __init__(self, leads_persistence_service: LeadsPersistence, domain):
        self.leads_persistence_service = leads_persistence_service
        self.domain = domain

    def get_leads(self, page, per_page, from_date, to_date, regions, page_visits, average_time_sec,
                  recurring_visits, sort_by, sort_order, search_query, from_time, to_time, behavior_type, status):
        leads, count, max_page = self.leads_persistence_service.filter_leads(
            domain_id=self.domain.id,
            page=page,
            per_page=per_page,
            from_date=from_date,
            to_date=to_date,
            regions=regions,
            page_visits=page_visits,
            average_time_sec=average_time_sec,
            behavior_type=behavior_type,
            recurring_visits=recurring_visits,
            sort_by=sort_by,
            sort_order=sort_order,
            search_query=search_query,
            from_time=from_time,
            to_time=to_time,
            status=status
        )

        leads_list = []
        for lead in leads:
            if not lead[66]:
                leads_list.append({
                    'id': lead[0],
                    'first_name': lead[1],
                    'last_name': lead[9],
                    'behavior_type': 'converted_sales' if lead[65] else lead[56],
                    'first_visited_date': lead[59].strftime('%d.%m.%Y'),
                    'first_visited_time': lead[60].strftime('%H:%M'),
                    'visitor_type': lead[63],
                    'average_time_sec': lead[64],
                    'is_active': lead[66]
                })
            else:
                leads_list.append({
                    'id': lead[0],
                    'first_name': lead[1],
                    'programmatic_business_emails': lead[2],
                    'mobile_phone': lead[3],
                    'personal_phone': lead[4].strip() if lead[4] else None,
                    'gender': lead[5],
                    'direct_number': (
                            ', '.join(
                                num.strip() for num in lead[6].split(',')
                                if all(num.strip() != direct.strip() for direct in lead[4].split(','))
                            ) or None
                    ) if lead[6] else None,
                    'business_email': lead[7],
                    'personal_emails': lead[8],
                    'last_name': lead[9],
                    'personal_city': lead[10],
                    'personal_state': lead[11],
                    'company_name': lead[12],
                    'company_domain': lead[13],
                    'company_phone': lead[14],
                    'company_sic': lead[15],
                    'company_address': lead[16],
                    'company_city': lead[17],
                    'company_state': lead[18],
                    'company_linkedin_url': lead[19],
                    'company_revenue': lead[20],
                    'company_employee_count': lead[21],
                    'net_worth': lead[22],
                    'job_title': lead[23],
                    'last_updated': lead[24],
                    'personal_emails_last_seen': lead[25].strftime('%d.%m.%Y %H:%M') if lead[25] else None,
                    'company_last_updated': lead[26].strftime('%d.%m.%Y %H:%M') if lead[26] else None,
                    'job_title_last_updated': lead[27].strftime('%d.%m.%Y %H:%M') if lead[27] else None,
                    'age_min': lead[28],
                    'age_max': lead[29],
                    'additional_personal_emails': lead[30],
                    'linkedin_url': lead[31],
                    'personal_address': lead[32],
                    'personal_address_2': lead[33],
                    'married': lead[34],
                    'children': lead[35],
                    'income_range': lead[36],
                    'homeowner': lead[37],
                    'seniority_level': lead[38],
                    'department': lead[39],
                    'professional_address': lead[40],
                    'professional_address_2': lead[41],
                    'professional_city': lead[42],
                    'professional_state': lead[43],
                    'primary_industry': lead[44],
                    'business_email_validation_status': lead[45],
                    'business_email_last_seen': lead[46],
                    'personal_emails_validation_status': lead[47],
                    'work_history': lead[48],
                    'education_history': lead[49],
                    'company_description': lead[50],
                    'related_domains': lead[51],
                    'social_connections': lead[52],
                    'personal_zip': lead[53],
                    'professional_zip': lead[54],
                    'company_zip': lead[55],
                    'behavior_type': 'converted_sales' if lead[65] else lead[56],
                    'state': lead[57].title() if lead[57] else None,
                    'city': lead[58].title() if lead[58] else None,
                    'first_visited_date': lead[59].strftime('%d.%m.%Y'),
                    'first_visited_time': lead[60].strftime('%H:%M'),
                    'time_spent': lead[61],
                    'recurring_visits': lead[62],
                    'visitor_type': lead[63],
                    'average_time_sec': lead[64],
                    'is_active': lead[66]
                })

        return leads_list, count, max_page

    def download_leads(self, from_date=None, to_date=None, regions=None, page_visits=None, average_time_spent=None,
                       behavior_type=None, status=None, recurring_visits=None, sort_by=None,
                       sort_order=None, search_query=None, from_time=None, to_time=None, leads_ids=0):
        if leads_ids == 0:
            results = self.leads_persistence_service.get_full_user_leads_by_filters(domain_id=self.domain.id,
                                                                                    from_date=from_date,
                                                                                    to_date=to_date, regions=regions,
                                                                                    page_visits=page_visits,
                                                                                    average_time_spent=average_time_spent,
                                                                                    behavior_type=behavior_type,
                                                                                    status=status,
                                                                                    recurring_visits=recurring_visits,
                                                                                    sort_by=sort_by,
                                                                                    sort_order=sort_order,
                                                                                    search_query=search_query,
                                                                                    from_time=from_time, to_time=to_time
                                                                                    )
        else:
            results = self.leads_persistence_service.get_full_user_leads_by_ids(self.domain.id, leads_ids)
        if len(results) == 0:
            return None
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            ['First name', 'Last name', 'Mobile phone', 'Personal phone', 'Direct number', 'Address', 'City', 'State', 'Zip', 
            'Personal email', 'Personal email last seen', 'Business email', 'Business email last seen', 'Personal LinkedIn url', 
            'Gender', 'Age range', 'Marital status', 'Children', 'Job title', 'Seniority level', 'Department', 'Company name', 'Company domain', 'Company phone', 'Company description', 
            'Business email', 'Business email last seen', 'Company last updated', 'Company address', 'Company city', 'Company state', 'Company zipcode', 'Income range', 'Net worth', 'Company revenue',
            'Company employee count', 'Primary industry', 'Followers', 'Company LinkedIn url'])
        for result in results:
            relevant_data = [
                result.first_name or 'None',
                result.last_name or 'None',
                result.mobile_phone or 'None',
                result.personal_phone or 'None',
                result.direct_number or 'None',
                result.personal_address or 'None',
                result.personal_city or 'None',
                result.personal_state or 'None',
                result.personal_zip or 'None',
                result.personal_emails or 'None',
                result.personal_emails_last_seen or 'None',
                result.business_email or 'None',
                result.business_email_last_seen or 'None',
                result.linkedin_url or 'None',
                result.gender or 'None',
                f"{result.age_min} - {result.age_max}" if result.age_min is not None and result.age_max is not None else 'None',
                result.married or 'None',
                result.children or 'None',
                result.job_title or 'None',
                result.seniority_level or 'None',
                result.department or 'None',
                result.company_name or 'None',
                result.company_domain or 'None',
                result.company_phone or 'None',
                result.company_description or 'None',
                result.business_email or 'None',
                result.business_email_last_seen or 'None',
                result.company_last_updated or 'None',
                result.company_address or 'None',
                result.company_city or 'None',
                result.company_state or 'None',
                result.company_zip or 'None',
                result.income_range or 'None',
                result.net_worth or 'None',
                result.company_revenue or 'None',
                result.company_employee_count or 'None',
                result.primary_industry or 'None',
                result.social_connections or 'None',
                result.company_linkedin_url or 'None'
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

    def search_contact(self, start_letter):
        start_letter = start_letter.replace('+', '').strip().lower()
        if start_letter.split()[0].isdecimal():
            start_letter = start_letter.replace(' ', '')
        leads_data = self.leads_persistence_service.search_contact(start_letter=start_letter, domain_id=self.domain.id)
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
        location_data = self.leads_persistence_service.search_location(start_letter=start_letter,
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
