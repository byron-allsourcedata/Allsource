from persistence.audience_lookalikes import AudienceLookalikesPersistence
from enums import BaseEnum


class AudienceLookalikesService:
    def __init__(self, lookalikes_persistence_service: AudienceLookalikesPersistence):
        self.lookalikes_persistence_service = lookalikes_persistence_service

    def get_lookalikes(self, user, page, per_page, from_date, to_date, sort_by, sort_order,
                       lookalike_size, lookalike_type, search_query):
        lookalikes, count, max_page = self.lookalikes_persistence_service.\
            get_lookalikes(user_id=user.get('id'), page=page, per_page=per_page, sort_by=sort_by, sort_order=sort_order,
                           from_date=from_date, to_date=to_date, lookalike_size=lookalike_size,
                           lookalike_type=lookalike_type, search_query=search_query)
        return lookalikes, count, max_page

    def get_source_info(self, uuid_of_source, user):
        source_info = self.lookalikes_persistence_service.get_source_info(uuid_of_source, user.get('id'))
        if source_info:
            sources, created_by = source_info
            return {
                'name': sources.name,
                'source': sources.source_origin,
                'type': sources.source_type,
                'created_date': sources.created_at,
                'created_by': created_by,
                'number_of_customers': sources.total_records,
                'matched_records': sources.matched_records,
            }
        return {}

    def delete_lookalike(self, uuid_of_lookalike, user):
        delete_lookalike = self.lookalikes_persistence_service.delete_lookalike(uuid_of_lookalike, user.get('id'))
        if delete_lookalike:
            return {'status': 'SUCCESS'}
        return {'status': 'FAILURE'}

    def create_lookalike(self, user, uuid_of_source, lookalike_size, lookalike_name, created_by_user_id):
        lookalike = self.lookalikes_persistence_service.create_lookalike(
            uuid_of_source, user.get('id'), lookalike_size, lookalike_name, created_by_user_id
        )
        return {
            'status': BaseEnum.SUCCESS,
            'lookalike': lookalike
        }

    def update_lookalike(self, uuid_of_lookalike, name_of_lookalike, user):
        update = self.lookalikes_persistence_service.update_lookalike(
            uuid_of_lookalike=uuid_of_lookalike, name_of_lookalike=name_of_lookalike, user_id=user.get('id')
        )
        if update:
            return {'status': 'SUCCESS'}
        return {'status': 'FAILURE'}

    def search_lookalikes(self, start_letter, user):
        lookalike_data = self.lookalikes_persistence_service.search_lookalikes(start_letter=start_letter,
                                                                               user_id=user.get('id'))
        results = set()
        for lookalike, source_name, source_type, creator_name in lookalike_data:
                if start_letter.lower() in lookalike.name.lower():
                    results.add(lookalike.name)
                if start_letter.lower() in source_name.lower():
                    results.add(source_name)
                if start_letter.lower() in creator_name.lower():
                    results.add(creator_name)

        limited_results = list(results)[:10]
        return limited_results

