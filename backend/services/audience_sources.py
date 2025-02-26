import csv
from persistence.audience_sources_persistence import AudienceSourcesPersistence


class AudienceSourceService:
    def __init__(self, sources_persistence_service: AudienceSourcesPersistence):
        self.sources_persistence_service = sources_persistence_service


    def get_sources(self, page, per_page, sort_by, sort_order):
        sources, count = self.sources_persistence_service.get_sources(
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order
        )

        source_list = []
        for source in sources:

            source_list.append({
                'id': source[0],
                'source_name': source[1],
                'source_origin': source[2],
                'source_type': source[3],
                'created_date': source[4],
                'created_by': source[5],
                'updated_date': source[6],
                'total_records': source[7],
                'matched_records': source[8]
            })

        return source_list, count

