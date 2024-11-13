from datetime import datetime, timedelta
from persistence.domains import UserDomainsPersistence
from persistence.leads_persistence import LeadsPersistence

class ZapierIntegrationService: 

    def __init__(self, lead_persistence: LeadsPersistence, domain_persistence: UserDomainsPersistence):
        self.lead_persistence = lead_persistence
        self.domain_persistence = domain_persistence

    def get_leads_last_time(self, domain_id):
        params = {
            "page": 1,
            "per_page": 1000,
            "from_date": None,
            "to_date": None,
            "regions": None,
            "page_visits": None,
            "average_time_sec": None,
            "behavior_type": None,
            "status": None,
            "recurring_visits": None,
            "sort_by": None,
            "sort_order": None,
            "search_query": None,
            "from_time": None,
            "to_time": None
        }
        leads, count, max_page = self.lead_persistence.filter_leads(domain_id=domain_id, **params)
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
        return leads_list