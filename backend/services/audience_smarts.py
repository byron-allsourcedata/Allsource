import logging
from typing import Optional, List
import json
import io
import csv

from persistence.audience_lookalikes import AudienceLookalikesPersistence
from persistence.audience_sources_persistence import AudienceSourcesPersistence
from schemas.audience import SmartsAudienceObjectResponse, DataSourcesFormat, DataSourcesResponse
from persistence.audience_smarts import AudienceSmartsPersistence
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from models.users import User
from enums import AudienceSmartDataSource, QueueName
from uuid import UUID

logger = logging.getLogger(__name__)

class AudienceSmartsService:
    def __init__(self, audience_smarts_persistence: AudienceSmartsPersistence,
                 lookalikes_persistence_service: AudienceLookalikesPersistence,
                 audience_sources_persistence: AudienceSourcesPersistence
                 ):
        self.audience_smarts_persistence = audience_smarts_persistence
        self.lookalikes_persistence_service = lookalikes_persistence_service
        self.audience_sources_persistence = audience_sources_persistence

    def get_audience_smarts(
            self,
            user: User,
            page: int,
            per_page: int,
            sort_by: Optional[str] = None,
            sort_order: Optional[str] = None,
            from_date: Optional[str] = None,
            to_date: Optional[str] = None,
            search_query: Optional[str] = None,
            statuses: Optional[List[str]] = None, 
            use_cases:Optional[List[str]] = None, 
    ) -> SmartsAudienceObjectResponse:
        audience_smarts, count = self.audience_smarts_persistence.get_audience_smarts(
            user_id=user.get("id"),
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            from_date=from_date,
            to_date=to_date,
            search_query=search_query,
            statuses=statuses,
            use_cases=use_cases
        )

        audience_smarts_list = []
        for item in audience_smarts:
            integrations = json.loads(item[9]) if item[9] else []
            audience_smarts_list.append({
                'id': item[0],
                'name': item[1],
                'use_case_alias': item[2],
                'created_by': item[3],
                'created_at': item[4],
                'total_records': item[5],
                'validated_records': item[6],
                'active_segment_records': item[7],
                'status': item[8],
                'integrations': integrations,
                'processed_active_segment_records': item[10],
            })

        return audience_smarts_list, count
    

    def search_audience_smart(self, start_letter: str, user: User):
        smarts = self.audience_smarts_persistence.search_audience_smart(
            user_id=user.get('id'),
            start_letter=start_letter
        )
        results = set()
        for smart_audience_name, creator_name in smarts:
                if start_letter.lower() in smart_audience_name.lower():
                    results.add(smart_audience_name)
                if start_letter.lower() in creator_name.lower():
                    results.add(creator_name)

        limited_results = list(results)[:10]
        return limited_results


    def delete_audience_smart(self, id: UUID) -> bool:
        count_deleted = self.audience_smarts_persistence.delete_audience_smart(id)
        return count_deleted > 0


    def update_audience_smart(self, id: UUID, new_name: str) -> bool:
        count_updated = self.audience_smarts_persistence.update_audience_smart(id, new_name)
        return count_updated > 0
    

    def transform_datasource(self, raw_data: dict) -> DataSourcesFormat:
        data_sources = {
            "lookalike_ids": {"include": [], "exclude": []},
            "source_ids": {"include": [], "exclude": []}
        }

        for item in raw_data:
            key = "lookalike_ids" if item["sourceLookalike"] == "Lookalike" else "source_ids"
            include_exclude = "include" if item["includeExclude"] == "Include" else "exclude"

            data_sources[key][include_exclude].append(item["selectedSourceId"])

        return data_sources

    
    async def start_scripts_for_matching(self, 
            aud_smart_id: UUID, 
            user_id: int, 
            data_sources: dict, 
            contacts_to_validate: int
        ):

        queue_name = QueueName.AUDIENCE_SMARTS_FILLER.value
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        data = {
            'aud_smart_id': str(aud_smart_id),
            'user_id': user_id,
            'data_sources': self.transform_datasource(data_sources),
            "active_segment": contacts_to_validate
        }
            
        try:
            message_body = {'data': data}
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body=message_body
            )
        except Exception as e:
            logger.error(f"Failed to publish message to {queue_name}. Error: {e}")
        finally:
            await rabbitmq_connection.close()

    async def create_audience_smart(
            self,
            name: str,
            user: dict,
            created_by_user_id: int,
            use_case_alias: str,
            data_sources: List[dict],
            validation_params: Optional[dict],
            contacts_to_validate: int
    ):

        created_data = self.audience_smarts_persistence.create_audience_smart(
            name=name,
            user_id=user.get('id'),
            created_by_user_id=created_by_user_id,
            use_case_alias=use_case_alias,
            validation_params=validation_params,
            data_sources=data_sources,
            contacts_to_validate=contacts_to_validate
        )
        await self.start_scripts_for_matching(created_data.id, user.get("id"), data_sources, contacts_to_validate)
        return created_data


    def calculate_smart_audience(self, raw_data_sources: dict) -> int:
        transformed_data_source = self.transform_datasource(raw_data_sources)
        return self.audience_smarts_persistence.calculate_smart_audience(transformed_data_source)
    
    def get_datasources_by_aud_smart_id(self, id: UUID) -> DataSourcesResponse:
        data_sources = self.audience_smarts_persistence.get_datasources_by_aud_smart_id(id)
        includes = []
        excludes = []

        for data_source in data_sources:
            source_data = {
                "name": data_source.lookalike_name or data_source.source_name,
                "source_type": data_source.source_type,
                "size": data_source.lookalike_size if data_source.lookalike_name else data_source.matched_records
            }

            if data_source.data_type == AudienceSmartDataSource.INCLUDE.value:
                includes.append(source_data)
            elif data_source.data_type == AudienceSmartDataSource.EXCLUDE.value:
                excludes.append(source_data)

        return {"includes": includes, "excludes": excludes}


    def get_datasource(self, user: dict):
        lookalikes, count, max_page = self.lookalikes_persistence_service.get_lookalikes(
            user_id=user.get('id'), page=1, per_page=50
        )

        sources, count = self.audience_sources_persistence.get_sources(
            user_id=user.get("id"), page=1, per_page=50
        )

        source_list = [
            {
                'id': source[0],
                'name': source[1],
                'source_origin': source[2],
                'source_type': source[3],
                'created_at': source[5],
                'created_by': source[4],
                'domain': source[6],
                'total_records': source[7],
                'matched_records': source[8],
                'matched_records_status': source[9],
                'processed_records': source[10],
            }
            for source in sources
        ]

        return {"lookalikes": lookalikes, "sources": source_list}


    def download_persons(self, smart_audience_id, sent_contacts, data_map):
        types = [contact.type for contact in data_map]
        values = [contact.value for contact in data_map]
        leads = self.audience_smarts_persistence.get_persons_by_smart_aud_id(smart_audience_id, sent_contacts, types)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(values)
        
        for lead in leads:
            relevant_data = [getattr(lead, field, "") for field in types]
            writer.writerow(relevant_data)

        output.seek(0)
        return output
