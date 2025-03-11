import os
import json
from openai import OpenAI
import logging
from typing import List, Optional
from schemas.audience import Row, SourcesObjectResponse, SourceResponse
from persistence.audience_sources_persistence import AudienceSourcesPersistence
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from enums import QueueName
from models.users import User

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)

class AudienceSourceService:
    def __init__(self, audience_sources_persistence: AudienceSourcesPersistence):
        self.audience_sources_persistence = audience_sources_persistence
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
                'updated_at': source[6],
                'total_records': source[7],
                'matched_records': source[8],
                'matched_records_status': source[9],
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


    async def send_matching_status(self, source_id, user_id, email_field):
        queue_name = QueueName.AUDIENCE_SOURCES_READER.value
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        try:
            message_body = {'data': {'source_id': str(source_id), 'email': email_field, 'user_id': user_id}}
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body=message_body
            )
        except Exception as e:
            await rabbitmq_connection.close()
        finally:
            await rabbitmq_connection.close()


    async def create_source(self, user, source_type: str, source_origin: str, source_name: str, rows: List[Row], file_url: str = None) -> SourceResponse:
        creating_data = {
            "user_id": user.get("id"),
            "source_type": source_type,
            "source_origin": source_origin,
            "source_name": source_name,
            "file_url": file_url,
            "rows": json.dumps([row.dict() for row in rows])
        }
        created_data = self.audience_sources_persistence.create_source(**creating_data)
        await self.send_matching_status(created_data.id, user.get("id"), rows[0].value)

        if not created_data:
            logger.debug('Database error during creation')

        setattr(created_data, "created_by", user.get("full_name"))

        response = SourceResponse.model_validate(created_data)
        return response
    

    def delete_source(self, id) -> bool:
        count_deleted = self.audience_sources_persistence.delete_source(id)
        return count_deleted > 0
    
    
    def get_sample_customers_list(self):
        return os.path.join(os.getcwd(), "data/sample-source-list.csv")
