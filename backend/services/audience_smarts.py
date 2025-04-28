import logging
from typing import Optional, List, Dict
import json
import io
import csv

from persistence.audience_lookalikes import AudienceLookalikesPersistence
from persistence.audience_sources import AudienceSourcesPersistence
from persistence.audience_settings import AudienceSettingPersistence
from schemas.audience import SmartsAudienceObjectResponse, DataSourcesFormat, DataSourcesResponse, SmartsResponse
from persistence.audience_smarts import AudienceSmartsPersistence
from models.enrichment.enrichment_users import EnrichmentUser
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from models.users import User
from enums import AudienceSmartDataSource, QueueName
from uuid import UUID
from enums import AudienceSmartStatuses

logger = logging.getLogger(__name__)

class AudienceSmartsService:
    VALID_DAYS = {30, 60, 90}

    def __init__(self, audience_smarts_persistence: AudienceSmartsPersistence,
                 lookalikes_persistence_service: AudienceLookalikesPersistence,
                 audience_sources_persistence: AudienceSourcesPersistence,
                 audience_settings_persistence: AudienceSettingPersistence,
                 ):
        self.audience_smarts_persistence = audience_smarts_persistence
        self.lookalikes_persistence_service = lookalikes_persistence_service
        self.audience_sources_persistence = audience_sources_persistence
        self.audience_settings_persistence = audience_settings_persistence

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

    def estimates_predictable_validation(self, validations: List[str]) -> Dict[str, float]:
        stats = self.audience_settings_persistence.get_average_success_validations()
        product = 1.0
        for key in validations:
            product *= stats.get(key, 1.0)

        return product

    def update_audience_smart(self, id: UUID, new_name: str) -> bool:
        count_updated = self.audience_smarts_persistence.update_audience_smart(id, new_name)
        return count_updated > 0

    def set_data_syncing_status(self, id: UUID) -> bool:
        count_updated = self.audience_smarts_persistence.set_data_syncing_status(id, AudienceSmartStatuses.DATA_SYNCING.value)
        return count_updated > 0
    

    def transform_datasource(self, raw_data: dict) -> DataSourcesFormat:
        data_sources = {
            "lookalike_ids": {"include": [], "exclude": []},
            "source_ids": {"include": [], "exclude": []}
        }

        for item in raw_data:
            key = "lookalike_ids" if item["sourceLookalike"] == "Lookalike" else "source_ids"
            include_exclude = "include" if item["includeExclude"] == "include" else "exclude"

            data_sources[key][include_exclude].append(item["selectedSourceId"])

        return data_sources

    
    async def start_scripts_for_matching(self, 
            aud_smart_id: UUID, 
            user_id: int, 
            need_validate: bool, 
            data_sources: dict, 
            active_segment_records: int,
            validation_params: dict
        ):

        queue_name = QueueName.AUDIENCE_SMARTS_FILLER.value
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        data = {
            'aud_smart_id': str(aud_smart_id),
            'user_id': user_id,
            'need_validate': need_validate,
            'data_sources': self.transform_datasource(data_sources),
            "active_segment": active_segment_records,
            "validation_params": validation_params
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
    
    def validate_recency_days(self, days: int):
        if days not in self.VALID_DAYS:
            raise ValueError(f"Invalid recency days: {days}.")


    async def create_audience_smart(
            self,
            name: str,
            user: dict,
            created_by_user_id: int,
            use_case_alias: str,
            data_sources: List[dict],
            validation_params: Optional[dict],
            active_segment_records: int,
            total_records: int,
            is_validate_skip: Optional[bool] = None,
            contacts_to_validate: Optional[int] = None,
    ) -> SmartsResponse:

        need_validate = False
        if is_validate_skip:
            status = AudienceSmartStatuses.UNVALIDATED.value
        elif not contacts_to_validate:
            status = AudienceSmartStatuses.N_A.value
        else:
            need_validate = True
            status = AudienceSmartStatuses.VALIDATING.value

        if validation_params:            
            for key in validation_params.keys():
                for item in validation_params[key]:
                    if "recency" in item:
                        self.validate_recency_days(item["recency"]["days"])
                        item["recency"]["processed"] = False
                    else:
                        for sub_key in item.keys():
                            item[sub_key]["processed"] = False

        created_data = self.audience_smarts_persistence.create_audience_smart(
            name=name,
            user_id=user.get('id'),
            created_by_user_id=created_by_user_id,
            use_case_alias=use_case_alias,
            validation_params=json.dumps(validation_params),
            data_sources=data_sources,
            active_segment_records=active_segment_records,
            total_records=total_records,
            status=status
        )
        await self.start_scripts_for_matching(created_data.id, user.get("id"), need_validate, data_sources, active_segment_records, validation_params)

        return SmartsResponse(
            id=created_data.id, name=created_data.name, use_case_alias=use_case_alias, created_by=user.get('full_name'),
            created_at=created_data.created_at, total_records=created_data.total_records,
            validated_records=created_data.validated_records, active_segment_records=created_data.active_segment_records,
            processed_active_segment_records=created_data.processed_active_segment_records, status=created_data.status, integrations=None
        )


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
        
        lookalike_list = []
        for (
            lookalike,
            source_name,
            source_type,
            created_by,
            source_origin,
            domain,
            target_schema
        ) in lookalikes:
            lookalike_list.append({
                **lookalike.__dict__,
                "source": source_name,
                "source_type": source_type,
                "created_by": created_by,
                "source_origin": source_origin,
                "domain": domain,
                "target_schema": target_schema
            })

        source_list = [
            {
                'id': s[0],
                'name': s[1],
                'source_type': s[3],
                'source_origin': s[4],
                'domain': s[7],
                'matched_records': s[9],
            }
            for s in sources
        ]

        return {"lookalikes": lookalike_list, "sources": source_list}


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
    

    def download_synced_persons(self, data_sync_id):
        exclude_fields = {"id", "state_abbr", "cid", "lat", "lon", "rec_id"}
        
        fields = EnrichmentUser.get_fields(exclude_fields=exclude_fields)
        headers = EnrichmentUser.get_headers(exclude_fields=exclude_fields)
        
        persons = self.audience_smarts_persistence.get_synced_persons_by_smart_aud_id(data_sync_id, fields)

        fields.insert(0, "email")
        headers.insert(0, "Email")
        fields.insert(-1, "state")
        headers.insert(-1, "State")

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        
        for lead in persons:
            relevant_data = [getattr(lead, field, "") for field in fields]
            writer.writerow(relevant_data)

        output.seek(0)
        return output


    def get_processing_source(self, id: str) -> Optional[SmartsResponse]:
        smart_source = self.audience_smarts_persistence.get_processing_sources(id)
        if not smart_source:
            return None

        (source_id, name, use_case_alias, created_by, created_at,
         total_records, validated_records,
         active_segment_records, processed_active_segment_records,
         status) = smart_source

        return SmartsResponse(
            id=source_id,
            name=name,
            use_case_alias=use_case_alias,
            created_by=created_by,
            created_at=created_at,
            total_records=total_records,
            validated_records=validated_records,
            active_segment_records=active_segment_records,
            processed_active_segment_records=processed_active_segment_records,
            status=status,
            integrations=None
        )