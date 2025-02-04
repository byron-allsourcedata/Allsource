import logging
from models.users import Users
from models.users_domains import UserDomains
from persistence.leads_persistence import LeadsPersistence
from persistence.user_persistence import UserPersistence

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self, leads_persistence_service: LeadsPersistence, user_persistence: UserPersistence, domain: UserDomains):
        self.leads_persistence_service = leads_persistence_service
        self.user_persistence = user_persistence
        self.domain = domain

    def get_revenue(self, from_date, to_date, user):
        if user.get("business_type") == 'b2b':
            return 
        
        results, lifetime_revenue, investment = self.leads_persistence_service.get_revenue_data(
            domain_id=self.domain.id,
            from_date=from_date,
            to_date=to_date,
            user_id=user.get('id')
        )

        if results:
            results.sort(key=lambda result: result.start_date)

        daily_data = {}
        total_orders_abandoned_cart = 0
        total_orders_view_products = 0
        total_orders_visitors = 0

        accumulated_total_price = 0
        accumulated_viewed_product = 0
        accumulated_abandoned_cart = 0
        accumulated_visitor = 0

        for result in results:
            date_str = result.start_date.isoformat()
            if date_str not in daily_data:
                daily_data[date_str] = {
                    'total_price': 0,
                    'visitor': 0,
                    'viewed_product': 0,
                    'abandoned_cart': 0,
                }

            accumulated_total_price += int(result.total_price)
            daily_data[date_str]['total_price'] = accumulated_total_price

            if result.behavior_type == 'viewed_product':
                total_orders_view_products += result.total_orders
                accumulated_viewed_product += int(result.total_price)

            elif result.behavior_type == 'product_added_to_cart':
                total_orders_abandoned_cart += result.total_orders
                accumulated_abandoned_cart += int(result.total_price)

            elif result.behavior_type == 'visitor':
                total_orders_visitors += result.total_orders
                accumulated_visitor += int(result.total_price)

            daily_data[date_str]['viewed_product'] = accumulated_viewed_product
            daily_data[date_str]['abandoned_cart'] = accumulated_abandoned_cart
            daily_data[date_str]['visitor'] = accumulated_visitor

        total_revenue = accumulated_total_price
        total_visitors = accumulated_visitor
        view_products = accumulated_viewed_product
        abandoned_cart = accumulated_abandoned_cart

        roi = (lifetime_revenue - investment) / investment if lifetime_revenue > 0 and investment > 0 else 0

        response = {
            'daily_data': daily_data,
            'total_counts': {
                'total_revenue': total_revenue,
                'total_visitors': total_visitors,
                'total_view_products': view_products,
                'total_abandoned_cart': abandoned_cart
            },
            'total_order': {
                'total_orders_abandoned_cart': total_orders_abandoned_cart,
                'total_orders_view_products': total_orders_view_products,
                'total_orders_visitors': total_orders_visitors,
            },
            'average_order': {
                'average_order_visitors': round(total_visitors / total_orders_visitors,
                                                3) if total_orders_visitors > 0 else 0,
                'average_order_abandoned_cart': round(abandoned_cart / total_orders_abandoned_cart,
                                                      3) if total_orders_abandoned_cart > 0 else 0,
                'average_order_view_products': round(view_products / total_orders_view_products,
                                                     3) if total_orders_view_products > 0 else 0
            },
            'ROI': round(roi, 2) if roi else 0,
            'lifetime_revenue': int(lifetime_revenue),
        }
        return response
    
    def get_contact(self, from_date, to_date):
        new_leads_data, returning_visitors_data, page_views_data = self.leads_persistence_service.get_contact_data(
            domain_id=self.domain.id,
            from_date=from_date,
            to_date=to_date
        )
        results = []
        all_dates = set([d[0] for d in new_leads_data] + [d[0] for d in returning_visitors_data] + [d[0] for d in page_views_data])

        for date in sorted(all_dates):
            new_leads = next((item[1] for item in new_leads_data if item[0] == date), 0)
            returning_visitors = next((item[1] for item in returning_visitors_data if item[0] == date), 0)
            page_views = next((item[1] for item in page_views_data if item[0] == date), 0)
            
            results.append({
                'start_date': date,
                'new_leads': new_leads,
                'returning_visitors': returning_visitors,
                'page_views': page_views
            })
        daily_data = {}
        
        total_counts = {
            'total_contacts_collected': 0,
            'total_new_leads': 0,
            'total_returning_visitors': 0,
            'total_page_views': 0,
        }
    
        accumulated_contacts_collected = 0
        accumulated_new_leads = 0
        accumulated_returning_visitors = 0
        accumulated_page_views = 0

        for result in results:
            start_date = result.get('start_date').isoformat()
            accumulated_contacts_collected += result.get('new_leads', 0) + result.get('returning_visitors', 0)
            accumulated_new_leads += result.get('new_leads', 0)
            accumulated_returning_visitors += result.get('returning_visitors', 0)
            accumulated_page_views += result.get('page_views', 0)
            daily_data[start_date] = {
                'contacts_collected': accumulated_contacts_collected,
                'new_leads': accumulated_new_leads,
                'returning_visitors': accumulated_returning_visitors,
                'page_views': accumulated_page_views,
            }
            
            total_counts['total_contacts_collected'] += result.get('new_leads', 0) + result.get('returning_visitors', 0)
            total_counts['total_new_leads'] += result.get('new_leads', 0)
            total_counts['total_returning_visitors'] += result.get('returning_visitors', 0)
            total_counts['total_page_views'] += result.get('page_views', 0)

        response = {
            'daily_data': daily_data,
            'total_counts': total_counts
        }

        return response
