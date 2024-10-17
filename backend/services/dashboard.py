import logging
from models.users import Users
from models.users_domains import UserDomains
from persistence.leads_persistence import LeadsPersistence

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self, leads_persistence_service: LeadsPersistence, domain: UserDomains):
        self.leads_persistence_service = leads_persistence_service
        self.domain = domain

    def get_contact(self, from_date, to_date):
        results = self.leads_persistence_service.get_contact_data(
            domain_id=self.domain.id,
            from_date=from_date,
            to_date=to_date
        )
        
        dates_counts = []
        daily_counts = {}
        total_counts = {
            'total_contacts_collected': 0,
            'total_visitors': 0,
            'total_view_products': 0,
            'total_abandoned_cart': 0
        }

        for result in results:
            start_date = result[0]
            behavior_type = result[1]
            lead_count = result.lead_count

            # Добавление данных в список
            dates_counts.append({
                'start_date': start_date,
                'behavior_type': behavior_type,
                'lead_count': lead_count
            })

            # Подсчет общего количества по типам поведения
            total_counts['total_contacts_collected'] += lead_count
            
            if behavior_type == 'visitor':
                total_counts['total_visitors'] += lead_count
            elif behavior_type == 'view_product':
                total_counts['total_view_products'] += lead_count
            elif behavior_type == 'abandoned_cart':
                total_counts['total_abandoned_cart'] += lead_count

            # Подсчет для каждого дня
            if start_date not in daily_counts:
                daily_counts[start_date] = 0
            daily_counts[start_date] += lead_count
            
        for date in daily_counts:
            dates_counts.append({
                'start_date': date,
                'behavior_type': 'total',
                'lead_count': daily_counts[date]
            })
            
        dates_counts.append({
            'total_contacts_collected': total_counts['total_contacts_collected'],
            'total_visitors': total_counts['total_visitors'],
            'total_view_products': total_counts['total_view_products'],
            'total_abandoned_cart': total_counts['total_abandoned_cart']
        })
        
        return dates_counts




        