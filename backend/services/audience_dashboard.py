import logging
from collections import defaultdict
from typing import Optional
from persistence.audience_dashboard import DashboardAudiencePersistence

logger = logging.getLogger(__name__)


class DashboardAudienceService:
    def __init__(self, dashboard_audience_persistence: DashboardAudiencePersistence):
        self.dashboard_persistence = dashboard_audience_persistence
        self.LIMIT = 5

    def get_contacts_for_pixel_contacts_statistics(self, *, user: dict):
        user_id = user.get('id')
        user_domains = self.dashboard_persistence.get_user_domains(user_id=user_id)

        results = self.dashboard_persistence.get_contacts_for_pixel_contacts_statistics(user_id=user_id)

        daily_data = {
            domain: {
                'total_leads': 0,
                'visitors': 0,
                'view_products': 0,
                'abandoned_cart': 0,
                'converted_sale': 0,
            }
            for domain in user_domains
        }

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
        
    def calculate_chain_data_sync(self, user_id) -> list[dict]:
        stmt_results = self.dashboard_persistence.get_chains_data_syncs(user_id=user_id)
        chain_data_sync = []  
        for (
            audience_source,
            audience_lookalikes,
            audience_smart,
            data_sync
        ) in stmt_results:
            tmp = set()
            if audience_source:
                tmp.add(audience_source.id)
            
            if audience_lookalikes:
                tmp.add(audience_lookalikes.id)
            
            if audience_smart:
                tmp.add(audience_smart.id)

            if data_sync:
                tmp.add(data_sync.id)
                
            chain_data_sync.append(list(tmp))
            
        return chain_data_sync
    
    def merge_and_sort(self, *, datasets: list[tuple], limit: int):
        combined = []

        for data, data_type, fields in datasets:
            for row in data:
                # Если row уже словарь, используем его напрямую
                if isinstance(row, dict):
                    row_dict = row
                elif hasattr(row, '_asdict'):
                    row_dict = row._asdict()
                else:
                    row_dict = {field: getattr(row, field, None) for field in fields}

                # Фильтруем только нужные поля
                filtered_data = {field: row_dict.get(field) for field in fields}
                filtered_data['type'] = data_type
                combined.append(filtered_data)

        # Сортируем по 'created_at' в порядке убывания
        sorted_combined = sorted(combined, key=lambda x: x.get('created_at'), reverse=True)
        return sorted_combined[:limit]

    
    def merge_data_with_chain(self, data, chains):
        result = []
        for row in data:
            data_id = row.get('id') if isinstance(row, dict) else getattr(row, 'id', None)
            if isinstance(row, dict):
                row_data = row
            elif hasattr(row, '_asdict'):
                row_data = row._asdict()
            else:
                row_data = {col: getattr(row, col) for col in dir(row)
                            if not col.startswith("_") and not callable(getattr(row, col))}
                
            matching_chain = next((chain for chain in chains if data_id in chain), None)
            if matching_chain:
                row_data['chain_ids'] = matching_chain
            result.append(row_data)
        return result

    def get_events(self, *, user: dict):
        data_syncs_chain = self.calculate_chain_data_sync(user_id=user.get('id'))
        sources, lookalikes = self.dashboard_persistence.get_last_sources_and_lookalikes(user_id=user.get('id'), limit=self.LIMIT)
        last_sources = self.merge_and_sort(
            datasets=[(sources, 'source', ['id', 'source_name', 'created_at', 'source_type', 'matched_records'])],
            limit=self.LIMIT
        )
        smart_audiences, data_syncs = self.dashboard_persistence.get_last_smart_audiences_and_data_syncs(user_id=user.get('id'), limit=self.LIMIT)
        last_lookalikes = self.merge_and_sort(
            datasets=[(lookalikes, 'lookalikes', ['id', 'lookalike_size', 'lookalike_name', 'created_at', 'size'])],
            limit=self.LIMIT
        )
        
        last_audience_smart = self.merge_and_sort(
            datasets=[(smart_audiences, 'smart_audience', ['id', 'audience_name', 'created_at', 'use_case', 'active_segment', 'include', 'exclude'])],
            limit=self.LIMIT
        )
        
        return {
            'short_info': {
                'sources': self.merge_data_with_chain(last_sources, data_syncs_chain),
                'lookalikes': self.merge_data_with_chain(last_lookalikes, data_syncs_chain),
                'smart_audiences': self.merge_data_with_chain(last_audience_smart, data_syncs_chain),
                'data_sync': self.merge_data_with_chain(data_syncs, data_syncs_chain)
            },
            'full_info':{
                'sources': self.merge_and_sort(
                                datasets=[
                                    (sources, 'source', ['source_name', 'created_at', 'source_type', 'matched_records']),
                                    ([lookalike for lookalike in lookalikes if lookalike[0]], 'lookalike', ['source_name', 'source_type', 'matched_records', 'lookalike_name', 'created_at', 'lookalike_size', 'size'])
                                ],
                                limit=self.LIMIT
                            ),
                           
                'lookalikes': self.merge_and_sort(
                                    datasets=[(lookalikes, 'lookalikes', ['lookalike_size', 'lookalike_name', 'created_at', 'size']), 
                                            ([smart_audience for smart_audience in smart_audiences if smart_audience.get('lookalike_name')], 'smart_audience', ['lookalike_name', 'lookalike_size', 'size', 'audience_name', 'use_case', 'active_segment', 'created_at']),],
                                    limit=self.LIMIT
                                ),
                
                'smart_audiences': self.merge_and_sort(
                                        datasets=[(data_syncs, 'data_syncs', ['audience_name', 'created_at', 'status', 'synced_contacts', 'destination']), 
                                                ([smart_audience for smart_audience in smart_audiences], 'smart_audience', ['audience_name', 'use_case', 'active_segment', 'created_at', 'include', 'exclude']),],
                                        limit=self.LIMIT
                                    ),
                
                'data_sync': [{
                            'id': sync.id,
                            'audience_name': sync.audience_name,
                            'status': sync.status,
                            'created_at': sync.created_at,
                            'synced_contacts': sync.synced_contacts,
                            'destination': sync.destination
                        } for sync in data_syncs]
            }
        }
    
    def get_contacts_for_pixel_contacts_by_domain_id(
            self, *, user: dict, domain_id: int, from_date: Optional[int] = None,
            to_date: Optional[int] = None) -> dict:
        results = self.dashboard_persistence.get_contacts_for_pixel_contacts_by_domain_id(user_id=user.get('id'), domain_id=domain_id, from_date=from_date, to_date=to_date)
        daily_data = defaultdict(lambda: {
            'total_leads': 0,
            'visitors': 0,
            'view_products': 0,
            'abandoned_cart': 0,
            'converted_sale': 0,
        })
        
        accumulated_total_leads = 0
        accumulated_visitors = 0
        accumulated_view_products = 0
        accumulated_abandoned_cart = 0
        accumulated_converted_sale = 0

        for date, behavior_type, converted_sales_count, lead_count in results:
            date_str = date.isoformat()
            data = daily_data[date_str]
            accumulated_total_leads += lead_count
            accumulated_converted_sale += converted_sales_count
            data['total_leads'] = accumulated_total_leads
            data['converted_sale'] = accumulated_converted_sale

            if behavior_type == 'viewed_product':
                accumulated_view_products += lead_count
            elif behavior_type == 'product_added_to_cart':
                accumulated_abandoned_cart += lead_count
            elif behavior_type == 'visitor':
                accumulated_visitors += lead_count
            
            data['view_products'] = accumulated_view_products
            data['abandoned_cart'] = accumulated_abandoned_cart
            data['visitors'] = accumulated_visitors


        return {
            "daily_data": dict(daily_data)
        }
