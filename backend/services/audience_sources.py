import os
import json
from openai import OpenAI
import logging
from typing import List, Optional
from schemas.audience import Row, SourcesObjectResponse, SourceResponse, NewSource
from persistence.audience_sources_persistence import AudienceSourcesPersistence
from persistence.domains import UserDomainsPersistence
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from enums import QueueName, SourceType
from models.users import User

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)

class AudienceSourceService:
    def __init__(self, audience_sources_persistence: AudienceSourcesPersistence, domain_persistence: UserDomainsPersistence):
        self.audience_sources_persistence = audience_sources_persistence
        self.domain_persistence = domain_persistence
        self.headings_map = {
            "Customer Conversions": ['Email', 'Phone number', 'Last Name', 'First Name', 'Transaction Date', 'Order Amount'],
            "Failed Leads": ['Email', 'Phone number', 'Last Name', 'First Name', 'Lead Date'],
            "Interest": ['Email', 'Phone number', 'Last Name', 'First Name', 'Interest Date']
        }

    def get_sources(
            self, 
            user: User, 
            page: int, 
            per_page: int, 
            sort_by: Optional[str] = None, 
            sort_order: Optional[str] = None
        ) -> SourcesObjectResponse:
        sources, count = self.audience_sources_persistence.get_sources(
            user_id=user.get("id"),
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order
        )

        source_list = []
        for source in sources:

            source_list.append({
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
            })

        return source_list, count


    def substitution_headings(self, source_type: str, headers: List[str]) -> Optional[List[str]]:
        default_headings = self.headings_map.get(source_type)
        prompt = (
            "You are given a list of CSV headers and a predefined list of default headers. "
            "Map each header in the default headers to the closest matching header from the provided list. "
            "If a header is in a different language, translate it before matching. "
            "If there is no close match, return 'None' for that header. "
            "Default headers: " + ", ".join(default_headings) + ".\n"
            "Headers to map: " + ", ".join(headers) + ".\n"
            "The output must be a comma-separated string of exactly 10 values, corresponding strictly to the predefined default headers: "
            "" + ", ".join(default_headings) + ".\n"
            "Do not include any comments, explanations, or extra information."
        )
        try:
            response = client.chat.completions.create(model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant skilled in data mapping."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3)

            updated_headers = response.choices[0].message.content
            return [header.strip() for header in updated_headers.split(",")]
        except Exception as e:
            logger.error("Error with ChatGPT API", exc_info=True)
            return None
        
    async def send_matching_status(self, source_id, user_id, type, statuses, domain_id=None, email_field = None):
        queue_name = QueueName.AUDIENCE_SOURCES_READER.value
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        data = {
            'source_id': str(source_id),
            'user_id': user_id
        }
        if type == SourceType.CSV.value:
            data['email'] = email_field
            
        if type == SourceType.PIXEL.value:
            data['domain_id'] = domain_id
            data['statuses'] = statuses
            
        try:
            message_body = {
                'type': type,
                'data': data
                }
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body=message_body
            )
        except Exception as e:
            logger.error(e)
        finally:
            await rabbitmq_connection.close()

    async def create_source(self, user: User, payload: NewSource) -> SourceResponse:
        creating_data = {
            "user_id": user.get("id"),
            "source_type": payload.source_type,
            "source_origin": payload.source_origin,
            "source_name": payload.source_name,
            "file_url": payload.file_url or None,
            "domain_id": payload.domain_id or None,
            "rows": json.dumps([row.dict() for row in payload.rows]) if payload.rows else None,
        }
        created_data = self.audience_sources_persistence.create_source(**creating_data)
        email_field = payload.rows[0].value if payload.rows else None
        await self.send_matching_status(created_data.id, user.get("id"), payload.source_origin, payload.source_type, payload.domain_id, email_field)
        
        if not created_data:
            logger.debug('Database error during creation')


        domain_name = self.domain_persistence.get_domain_name(created_data.domain_id)

        setattr(created_data, "created_by", user.get("full_name"))
        if domain_name:
            setattr(created_data, "domain", domain_name)

        response = SourceResponse.model_validate(created_data)
        return response

    def delete_source(self, id) -> bool:
        count_deleted = self.audience_sources_persistence.delete_source(id)
        return count_deleted > 0

    def get_sample_customers_list(self, source_type: str):
        return os.path.join(os.getcwd(), "data/sample-source-" + source_type + ".csv")

    def get_processing_sources(self, sources_ids, user: User):
        sources = self.audience_sources_persistence.get_processing_sources(sources_ids, user.get("id"))
        return sources