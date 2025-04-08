import logging
from collections import defaultdict
from persistence.audience_dashboard import DashboardAudiencePersistence

logger = logging.getLogger(__name__)


class DashboardAudienceService:
    def __init__(self, dashboard_audience_persistence: DashboardAudiencePersistence):
        self.dashboard_persistence = dashboard_audience_persistence
        self.LIMIT = 5
        
    def get_contacts_for_pixel_contacts_statistics(self, *, user: dict):
        results = self.dashboard_persistence.get_contacts_for_pixel_contacts_statistics(user_id=user.get('id'))
        daily_data = defaultdict(lambda: {
            'total_leads': 0,
            'visitors': 0,
            'view_products': 0,
            'abandoned_cart': 0,
            'converted_sale': 0,
        })

        for domain, behavior_type, count_converted_sales, lead_count in results:                    
            data = daily_data[domain]
            data['total_leads'] += lead_count
            data['converted_sale'] += count_converted_sales
            if behavior_type == 'viewed_product':
                data['view_products'] += lead_count
            elif behavior_type == 'product_added_to_cart':
                data['abandoned_cart'] += lead_count
            elif behavior_type == 'visitor':
                data['visitors'] += lead_count
        result_array = [
            {'domain': domain, **stats}
            for domain, stats in daily_data.items()
        ]
        
        return result_array

    def get_audience_dashboard_data(self, *, from_date: int, to_date: int, user: dict):
        total_counts = {}
        dashboard_audience_data = self.dashboard_persistence.get_dashboard_audience_data(
            from_date=from_date,
            to_date=to_date,
            user_id=user.get('id')
        )
        daily_data = self.get_contacts_for_pixel_contacts_statistics(user=user)
        
        for result in dashboard_audience_data:
            key = result['key']
            query = result['query']
            count = query.scalar()
            total_counts[key] = count or 0

        return {
            "total_counts": total_counts,
            "pixel_contacts": daily_data
        }
    
    def merge_and_sort(self, *, datasets, limit: int):
        combined = []
        
        for data, data_type in datasets:
            combined.extend([row._asdict() | {'type': data_type} for row in data])
        
        sorted_combined = sorted(combined, key=lambda x: x['created_at'], reverse=True)
        return sorted_combined[:limit]


    def get_events(self, *, user: dict):
        sources, lookalikes = self.dashboard_persistence.get_last_sources_and_lookalikes(user_id=user.get('id'), limit=self.LIMIT)
        last_sources_lookalikes = self.merge_and_sort(
            datasets=[(sources, 'source'), (lookalikes, 'lookalike')],
            limit=self.LIMIT
        )
        smart_audience, data_syncs = self.dashboard_persistence.get_last_smart_audiences_and_data_syncs(user_id=user.get('id'), limit=self.LIMIT)
        last_lookalikes_audience_smart = self.merge_and_sort(
            datasets=[(lookalikes, 'lookalikes'), (smart_audience, 'smart_audience')],
            limit=self.LIMIT
        )
        last_audience_smart_data_sync = self.merge_and_sort(
            datasets=[(smart_audience, 'smart_audience'), (data_syncs, 'data_syncs')],
            limit=self.LIMIT
        )
        return {
            'sources': last_sources_lookalikes,
            'lookalikes': last_lookalikes_audience_smart,
            'smart_audiences': last_audience_smart_data_sync,
            'data_sync': [row._asdict() for row in data_syncs]
        }
    
    def get_contacts_for_pixel_contacts_by_domain_id(self, *, user: dict, domain_id: int):
        results = self.dashboard_persistence.get_contacts_for_pixel_contacts_by_domain_id(user_id=user.get('id'), domain_id=domain_id)
        daily_data = defaultdict(lambda: {
            'total_leads': 0,
            'visitors': 0,
            'view_products': 0,
            'abandoned_cart': 0,
            'converted_sale': 0,
        })

        for date, behavior_type, converted_sales_count, lead_count in results:
            date_str = date.isoformat()
            data = daily_data[date_str]

            data['total_leads'] += lead_count
            data['converted_sale'] += converted_sales_count

            if behavior_type == 'viewed_product':
                data['view_products'] += lead_count
            elif behavior_type == 'product_added_to_cart':
                data['abandoned_cart'] += lead_count
            elif behavior_type == 'visitor':
                data['visitors'] += lead_count


        return {
            "daily_data": dict(daily_data)
        }
