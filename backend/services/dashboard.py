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
        if user.get("business_type") != 'd2c':
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
        results = self.leads_persistence_service.get_contact_data(
            domain_id=self.domain.id,
            from_date=from_date,
            to_date=to_date
        )
        if results:
            results.sort(key=lambda result: result.start_date)

        daily_data = {}
        accumulated_total_price = 0
        accumulated_viewed_product = 0
        accumulated_abandoned_cart = 0
        accumulated_visitor = 0
        accumulated_converted_sale = 0
        total_counts = {
            'total_contacts_collected': 0,
            'total_visitors': 0,
            'total_view_products': 0,
            'total_abandoned_cart': 0,
            'total_converted_sale': 0
        }

        for result in results:
            start_date = result[0].isoformat()
            behavior_type = result[1]
            is_converted_sales = result[2]
            lead_count = result.lead_count

            total_counts['total_contacts_collected'] += lead_count

            if behavior_type == 'visitor':
                total_counts['total_visitors'] += lead_count
            elif behavior_type == 'viewed_product':
                total_counts['total_view_products'] += lead_count
            elif behavior_type == 'product_added_to_cart':
                total_counts['total_abandoned_cart'] += lead_count
            if is_converted_sales:
                total_counts['total_converted_sale'] += lead_count

            if start_date not in daily_data:
                daily_data[start_date] = {
                    'total_leads': 0,
                    'visitors': 0,
                    'view_products': 0,
                    'abandoned_cart': 0,
                    'converted_sale': 0,
                }

            accumulated_total_price += lead_count
            daily_data[start_date]['total_leads'] = accumulated_total_price

            if behavior_type == 'visitor':
                accumulated_visitor += lead_count
            elif behavior_type == 'viewed_product':
                accumulated_viewed_product += lead_count
            elif behavior_type == 'product_added_to_cart':
                accumulated_abandoned_cart += lead_count
            if is_converted_sales:
                accumulated_converted_sale += lead_count

            daily_data[start_date]['visitors'] = accumulated_visitor
            daily_data[start_date]['view_products'] = accumulated_viewed_product
            daily_data[start_date]['abandoned_cart'] = accumulated_abandoned_cart
            daily_data[start_date]['converted_sale'] = accumulated_converted_sale

        response = {
            'daily_data': daily_data,
            'total_counts': total_counts
        }

        return response
