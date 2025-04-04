import os
import json
import csv
import logging
import io
from datetime import datetime
from openai import OpenAI
import csv
import io
from uuid import UUID
from typing import List, Optional, Dict
from uuid import UUID
from schemas.audience import Row, SourcesObjectResponse, SourceResponse, NewSource, DomainsSourceResponse
from persistence.audience_sources_persistence import AudienceSourcesPersistence
from persistence.domains import UserDomainsPersistence
from enums import TypeOfCustomer, TypeOfSourceOrigin
from persistence.audience_sources_matched_persons import AudienceSourcesMatchedPersonsPersistence
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from enums import QueueName, SourceType
from models.users import User

logger = logging.getLogger(__name__)

def normalize(value: float, min_val: float, max_val: float) -> float:
    return (value - min_val) / (max_val - min_val) if max_val > min_val else 0.0

class AudienceSourceService:
    def __init__(self, audience_sources_persistence: AudienceSourcesPersistence, domain_persistence: UserDomainsPersistence, audience_sources_matched_persons_persistence: AudienceSourcesMatchedPersonsPersistence):
        self.audience_sources_persistence = audience_sources_persistence
        self.domain_persistence = domain_persistence
        self.audience_sources_matched_persons_persistence = audience_sources_matched_persons_persistence
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
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
            sort_order: Optional[str] = None,
            name: Optional[str] = None,
            source_origin: Optional[str] = None,
            source_type: Optional[str] = None,
            domain_name: Optional[str] = None,
            created_date_start: Optional[datetime] = None,
            created_date_end: Optional[datetime] = None
    ) -> SourcesObjectResponse:
        sources, count = self.audience_sources_persistence.get_sources(
            user_id=user.get("id"),
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            name=name,
            source_origin=source_origin,
            source_type=source_type,
            domain_name=domain_name,
            created_date_start=created_date_start,
            created_date_end=created_date_end
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
    
    def download_value_calculation(self, source_id: UUID):
        audience_source = self.audience_sources_persistence.get_source_by_id(source_id=source_id)

        if not audience_source:
            return
        audience_sources_matched_persons = self.audience_sources_matched_persons_persistence.get_audience_sources_matched_persons_by_source_id(audience_source_id=source_id)
        if not audience_sources_matched_persons:
            return
        
        output = io.StringIO()
        writer = csv.writer(output)
        logging.info(f"uuid {source_id}")
        logging.info( audience_source.source_origin)

        if audience_source.source_origin == TypeOfSourceOrigin.PIXEL.value:
            logging.info(f"PIXEL source: {audience_source.source_origin}")
            writer.writerow([
                'First Name', 'Last Name', 'Email', 'Recency Score', 'Page View Score', 'User Value  Score'
            ])
            writer.writerow([
                '', '', '', '0.5 * (Inverted Recency - min(Inverted Recency)) / (max(Inverted Recency) - min(Inverted Recency)',
                'duration_minutes >= 2 ? 0.5 : duration_minutes >= 1 ? 0.25 : 0.0',
                'Recency Score + Page View Score'
            ])
            for person in audience_sources_matched_persons:
                relevant_data = [
                    person.first_name,
                    person.last_name,
                    person.email or '',
                    str(person.recency_normalized) if person.recency_normalized is not None else '',
                    str(person.view_score) if person.view_score is not None else '',
                    str(person.value_score) if person.value_score is not None else '',
                ]
                writer.writerow(relevant_data)

        if audience_source.source_origin == TypeOfSourceOrigin.CSV.value:
            if audience_source.source_type == TypeOfCustomer.CUSTOMER_CONVERSIONS.value:
                writer.writerow([
                    'Email', 'Last Transaction', 'Total Spend','Normalized Total Spend', 'Frequency',
                    'Normalized Frequency', 'Recency', 'Normalized Recency', 'Value'
                ])
                writer.writerow([
                    '', 'max(Transaction date)', 'sum(Amount)',
                    '(Totals Spend - min(Totals Spend)) / (max(Totals Spend) - min(Totals Spend))',
                    'count(transaction)', '(Frequency - min(Frequency)) / (max(Frequency) - min(Frequency)',
                    '(current_date - last_transaction).days',
                    '(Recency - min(Recency)) / (max(Recency) - min(Recency)',
                    'Normalized Total Spend + Normalized Frequency - Normalized Recency + 1'
                ])
                for person in audience_sources_matched_persons:
                    relevant_data = [
                        person.email or '',
                        str(person.orders_date) if person.orders_date is not None else '',
                        str(person.orders_amount) if person.orders_amount is not None else '',
                        str(person.orders_amount_normalized) if person.orders_amount_normalized is not None else '',
                        str(person.orders_count) if person.orders_count is not None else '',
                        str(person.orders_count_normalized) if person.orders_count_normalized is not None else '',
                        str(person.recency) if person.recency is not None else '',
                        str(person.recency_normalized) if person.recency_normalized is not None else '',
                        str(person.value_score) if person.value_score is not None else '',
                    ]
                    writer.writerow(relevant_data)

            if audience_source.source_type == TypeOfCustomer.FAILED_LEADS.value:
                writer.writerow([
                    'Email', 'LastLeadFailedDate', 'Frequency','Recency', 'Normalized Recency',
                    'Inverted Recency', 'Value'
                ])
                writer.writerow([
                    '', 'max(LastLeadFailedDate)', 'count(transaction)', '(current_date - last_transaction).days',
                    '(Inverted Recency - min(Inverted Recency)) / (max(Inverted Recency) - min(Inverted Recency)',
                    '1 / (Recency + 1)',
                    '(Inverted Recency - min(Inverted Recency)) / (max(Inverted Recency) - min(Inverted Recency)'
                ])
                for person in audience_sources_matched_persons:
                    relevant_data = [
                        person.email or '',
                        str(person.orders_date) if person.orders_date is not None else '',
                        str(person.orders_count) if person.orders_count is not None else '',
                        str(person.recency) if person.recency is not None else '',
                        str(person.recency_failed) if person.recency_failed is not None else '',
                        str(person.inverted_recency) if person.inverted_recency is not None else '',
                        str(person.value_score) if person.value_score is not None else '',
                    ]
                    writer.writerow(relevant_data)

            if audience_source.source_type == TypeOfCustomer.INTEREST.value:
                writer.writerow([
                    'Email', 'Intent data', 'FrequencyScore', 'RecencyScore',
                    'Inverted Recency', 'UserValue'
                ])
                writer.writerow([
                    '', 'max(Intent data)', '0.5 * Frequency - min(Frequency)) / (max(Frequency) - min(Frequency))',
                    '0.5 * (Inverted Recency - min(Inverted Recency)) / (max(Inverted Recency) - min(Inverted Recency)',
                    '1 / (Recency + 1)', 'RecencyScore + FrequencyScore'
                ])
                for person in audience_sources_matched_persons:
                    relevant_data = [
                        person.email or '',
                        str(person.orders_date) if person.orders_date is not None else '',
                        str(person.orders_count_normalized) if person.orders_count_normalized is not None else '',
                        str(person.recency_normalized) if person.recency_normalized is not None else '',
                        str(person.inverted_recency) if person.inverted_recency is not None else '',
                        str(person.value_score) if person.value_score is not None else '',
                    ]
                    writer.writerow(relevant_data)

        output.seek(0)

        return output

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
            response = self.client.chat.completions.create(model="gpt-4",
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
        
    async def send_matching_status(self, source_id, user_id, type, statuses, domain_id=None, mapped_fields = None):
        queue_name = QueueName.AUDIENCE_SOURCES_READER.value
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        data = {
            'source_id': str(source_id),
            'user_id': user_id,
            'type': type,
        }
        if type == SourceType.CSV.value:
            data['mapped_fields'] = mapped_fields
            data['statuses'] = statuses
            
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
        mapped_fields: Dict[str, str] = {row.type: row.value for row in payload.rows} if payload.rows else {}

        await self.send_matching_status(
            created_data.id,
            user.get("id"),
            payload.source_origin,
            payload.source_type,
            payload.domain_id,
            mapped_fields
        )
        
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

    def get_domains(self, user_id: int, page: int, per_page: int):
        result, has_more = self.audience_sources_persistence.get_domains_source(user_id=user_id, page=page, per_page=per_page)
        domains = [domain for _, domain in result]
        return DomainsSourceResponse(domains=domains, has_more=has_more)

    def get_processing_source(self, id: str) -> Optional[SourceResponse]:
        source = self.audience_sources_persistence.get_processing_sources(id)
        return None if not source else {
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

def normalize(value: float, min_val: float, max_val: float) -> float:
    return (value - min_val) / (max_val - min_val) if max_val > min_val else 0.0