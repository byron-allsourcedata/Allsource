import os
import json
from openai import OpenAI
import logging
from typing import List
from schemas.audience import Row
from persistence.audience_sources_persistence import AudienceSourcesPersistence
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from enums import QueueName

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)

class AudienceSourceService:
    def __init__(self, audience_sources_persistence: AudienceSourcesPersistence):
        self.audience_sources_persistence = audience_sources_persistence
        self.default_headings = ['Email', 'Phone number', 'Last Name', 'First Name', 'Gender', 'Age', 'Order Amount', 'State', 'City', 'Zip Code']


    def get_sources(self, user, page, per_page, sort_by, sort_order):
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
                'source_name': source[1],
                'source_origin': source[2],
                'source_type': source[3],
                'created_date': source[5],
                'created_by': source[4],
                'updated_date': source[6],
                'total_records': source[7],
                'matched_records': source[8],
                'matched_records_status': source[9],
            })

        return source_list, count


    def substitution_headings(self, headers): 
        prompt = (
            "You are given a list of CSV headers and a predefined list of default headers. "
            "Map each header in the default headers to the closest matching header from the provided list. "
            "If a header is in a different language, translate it before matching. "
            "If there is no close match, return 'None' for that header. "
            "Default headers: " + ", ".join(self.default_headings) + ".\n"
            "Headers to map: " + ", ".join(headers) + ".\n"
            "The output must be a comma-separated string of exactly 10 values, corresponding strictly to the predefined default headers: "
            "" + ", ".join(self.default_headings) + ".\n"
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


    async def send_matching_status(self, source_id, user_id, emailField):
        queue_name = QueueName.AUDIENCE_SOURCES_READER.value
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        try:
            message_body = {'data': {'source_id': source_id, 'email': emailField, 'user_id': user_id}}
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body=message_body
            )
        except Exception as e:
            await rabbitmq_connection.close()
        finally:
            await rabbitmq_connection.close()


    async def create_source(self, user, source_type: str, source_origin: str, source_name: str, rows: List[Row], file_url: str = None):
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

        return created_data
    

    def delete_source(self, id):
        self.audience_sources_persistence.delete_source(id)
        return True
