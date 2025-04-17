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
from persistence.audience_sources import AudienceSourcesPersistence
from persistence.domains import UserDomainsPersistence
from enums import TypeOfCustomer, TypeOfSourceOrigin, BusinessType
from persistence.audience_sources_matched_persons import AudienceSourcesMatchedPersonsPersistence
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from enums import QueueName, SourceType
from models.users import User

logger = logging.getLogger(__name__)


from decimal import Decimal
import logging
from functools import singledispatchmethod

class AudienceSourceMath:

    @staticmethod
    def normalize_float(value: float, min_val: float, max_val: float, coefficient=1.0) -> float:
        return coefficient * ((value - min_val) / (max_val - min_val) if max_val > min_val else 0.0)

    @staticmethod
    def normalize_decimal(value: Decimal, min_val: Decimal, max_val: Decimal, coefficient=Decimal('1.0')) -> Decimal:
        return coefficient * ((value - min_val) / (max_val - min_val) if max_val > min_val else Decimal("0.0"))


    @staticmethod
    def inverted_float(value: float) -> float:
        return 1 / (value + 1) if value != -1 else float('inf')

    @staticmethod
    def inverted_decimal(value: Decimal) -> Decimal:
        return Decimal("1.0") / (value + Decimal("1.0")) if value != Decimal("-1.0") else Decimal("Infinity")

    @staticmethod
    def weighted_score(first_data: Decimal, second_data: Decimal, third_data: Decimal,
                       w1: Decimal, w2: Decimal, w3: Decimal, correction: Decimal = Decimal("1.0")) -> Decimal:
        return w1 * first_data + w2 * second_data - w3 * third_data + correction



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
                'target_schema': source[2],
                'source_origin': source[3],
                'source_type': source[4],
                'created_at': source[6],
                'created_by': source[5],
                'domain': source[7],
                'total_records': source[8],
                'matched_records': source[9],
                'matched_records_status': source[10],
                'processed_records': source[11],
            })

        return source_list, count
    
    def download_value_calculation(self, source_id: UUID):
        audience_source = self.audience_sources_persistence.get_source_by_id(source_id=source_id)

        if not audience_source:
            return
        audience_sources_matched_persons, enrichment_persons = self.audience_sources_matched_persons_persistence.get_audience_sources_matched_persons_by_source_id(audience_source_id=source_id)
        if not audience_sources_matched_persons:
            return
        
        output = io.StringIO()
        writer = csv.writer(output)
        logging.info(f"uuid {source_id}")
        logging.info( audience_source.source_origin)

        if audience_source.source_origin == TypeOfSourceOrigin.PIXEL.value:
            logging.info(f"PIXEL source: {audience_source.source_origin}")
            writer.writerow([
                'Email', 'EventDate', 'Recency', 'MinRecency', 'MaxRecency',
                'InvertedRecency', 'MinInvertedRecency', 'MaxInvertedRecency', 'ActivEndDate', 'ActivStartDate',
                'Duration', 'Recency score', 'Page view score', 'User value score'
            ])

            writer.writerow([
                '', '(reference_date - EVENT_DATE).days', 'min(Recency)', 'max(Recency)',
                '1 / (Recency + 1)', '1 / (MinRecency + 1)', '1 / (MaxRecency + 1)', 'max(Date)', 'min(Date)',
                '(ActivEndDate - ActivStartDate).total_seconds()',
                '0.5 * (InvertedRecency - min(InvertedRecency)) / (max(InvertedRecency) - min(InvertedRecency)',
                'duration >= 2 ? 0.5 : duration >= 1 ? 0.25 : 0.0', 'RecencyScore + PageViewScore'
            ])

            for matched_person, enrichment_person in zip(audience_sources_matched_persons, enrichment_persons):
                relevant_data = [
                    str(matched_person.email) if matched_person.email else '',
                    str(matched_person.recency) if matched_person.recency is not None else '',
                    str(matched_person.recency_min) if matched_person.recency_min is not None else '',
                    str(matched_person.recency_max) if matched_person.recency_max is not None else '',
                    str(matched_person.inverted_recency) if matched_person.inverted_recency is not None else '',
                    str(matched_person.inverted_recency_min) if matched_person.inverted_recency_min is not None else '',
                    str(matched_person.inverted_recency_max) if matched_person.inverted_recency_max is not None else '',
                    str(matched_person.end_date) if matched_person.end_date else '',
                    str(matched_person.start_date) if matched_person.start_date else '',
                    str(matched_person.duration) if matched_person.duration is not None else '',
                    str(matched_person.recency_score) if matched_person.recency_score is not None else '',
                    str(matched_person.view_score) if matched_person.view_score is not None else '',
                    str(matched_person.value_score) if matched_person.value_score is not None else '',
                ]
                writer.writerow(relevant_data)

        if audience_source.source_origin == TypeOfSourceOrigin.CSV.value:
            if audience_source.source_type == TypeOfCustomer.CUSTOMER_CONVERSIONS.value:
                if audience_source.target_schema == BusinessType.B2C.value:
                    writer.writerow([
                        'Email', 'LastTransactionDate', 'Recency', 'MinRecency', 'MaxRecency', 'InvertedRecency',
                        'MinInvertedRecency', 'MaxInvertedRecency', 'ValueScore'
                    ])

                    writer.writerow([
                        '', 'max(Date)', '(reference_date - LastTransactionDate).days', 'min(Recency)',
                        'max(Recency)', '1 / (Recency + 1)', '1 / (MinInvertedRecency + 1)', '1 / (MaxInvertedRecency + 1)',
                        '(InvertedRecency - MinInvertedRecency) / (MaxInvertedRecency - MinInvertedRecency)',
                    ])
                    for person in audience_sources_matched_persons:
                        relevant_data = [
                            person.email or '',
                            str(person.start_date) if person.start_date is not None else '',
                            str(person.recency) if person.recency is not None else '',
                            str(person.recency_min) if person.recency_min is not None else '',
                            str(person.recency_max) if person.recency_max is not None else '',
                            str(person.inverted_recency) if person.inverted_recency is not None else '',
                            str(person.inverted_recency_min) if person.inverted_recency_min is not None else '',
                            str(person.inverted_recency_max) if person.inverted_recency_max is not None else '',
                            str(person.value_score) if person.value_score is not None else '',
                        ]
                        writer.writerow(relevant_data)

                if audience_source.target_schema == BusinessType.B2B.value:
                    writer.writerow([
                        'Email', 'LastTransactionDate', 'Recency', 'MinRecency', 'MaxRecency', 'InvertedRecency',
                        'MinInvertedRecency', 'MaxInvertedRecency', 'RecencyScore', 'ProfessionalScore',
                        'CompletenessScore', 'LeadValueScoreB2B'
                    ])

                    writer.writerow([
                        '', 'max(Date)', '(reference_date - LastTransactionDate).days', 'min(Recency)',
                        'max(Recency)', '1 / (Recency + 1)', '1 / (MinInvertedRecency + 1)',
                        '1 / (MaxInvertedRecency + 1)',
                        '(InvertedRecency - MinInvertedRecency) / (MaxInvertedRecency - MinInvertedRecency)',
                        '(0.5 * JobLevelWeight + 0.3 * DepartmentWeight + 0.2 * CompanySizeWeight)',
                        'sum(0.4 [if BUSINESS_EMAIL] + 0.3 [if LINKEDIN_URL] + 0.2 [if JobLevel] + 0.1 [Department])',
                        '(0.4 * RecencyScore) + (0.4 * ProfessionalScore) + (0.2 * CompletenessScore)'
                    ])
                    for person in audience_sources_matched_persons:
                        relevant_data = [
                            person.email or '',
                            str(person.start_date) if person.start_date is not None else '',
                            str(person.recency) if person.recency is not None else '',
                            str(person.recency_min) if person.recency_min is not None else '',
                            str(person.recency_max) if person.recency_max is not None else '',
                            str(person.inverted_recency) if person.inverted_recency is not None else '',
                            str(person.inverted_recency_min) if person.inverted_recency_min is not None else '',
                            str(person.inverted_recency_max) if person.inverted_recency_max is not None else '',
                            str(person.recency_score) if person.value_score is not None else '',
                            str(person.view_score) if person.view_score is not None else '',
                            str(person.sum_score) if person.sum_score is not None else '',
                            str(person.value_score) if person.value_score is not None else '',
                        ]
                        writer.writerow(relevant_data)

            if audience_source.source_type == TypeOfCustomer.FAILED_LEADS.value:
                writer.writerow([
                    'Email', 'LastLeadFailedDate', 'Frequency', 'Recency', 'MinRecency', 'MaxRecency',
                    'InvertedRecency', 'MinInvertedRecency', 'MaxInvertedRecency', 'ValueScore'
                ])
                writer.writerow([
                    '', 'max(Date)', 'count(transaction)', '(current_date - LastLeadFailedDate).days', 'min(Recency)',
                    'max(Recency)', '1 / (Recency + 1)', 'min(InvertedRecency)', 'max(InvertedRecency)',
                    '(InvertedRecency - MinInvertedRecency) / (MaxInvertedRecency - MinInvertedRecency'
                ])
                for person in audience_sources_matched_persons:
                    relevant_data = [
                        person.email or '',
                        str(person.start_date) if person.start_date is not None else '',
                        str(person.count) if person.count is not None else '',
                        str(person.recency) if person.recency is not None else '',
                        str(person.recency_min) if person.recency_min is not None else '',
                        str(person.recency_max) if person.recency_max is not None else '',
                        str(person.inverted_recency) if person.inverted_recency is not None else '',
                        str(person.inverted_recency_min) if person.inverted_recency_min is not None else '',
                        str(person.inverted_recency_max) if person.inverted_recency_max is not None else '',
                        str(person.value_score) if person.value_score is not None else '',
                    ]
                    writer.writerow(relevant_data)

            if audience_source.source_type == TypeOfCustomer.INTEREST.value:
                writer.writerow([
                    'Email', 'Frequency', 'MinFrequency', 'MaxFrequency', 'TS_Event', 'Recency', 'MinRecency', 'MaxRecency',
                    'InvertedRecency', 'MinInvertedRecency', 'MaxInvertedRecency', 'FrequencyScore', "RecencyScore",
                    'UserValueScore'
                ])
                writer.writerow([
                    '', 'count(Transaction)', 'min(Frequency)', 'max(Frequency)', 'max(Date)',
                    '(current_date - TS_Event).days', 'min(Recency)', 'max(Recency)', '1 / (Recency + 1)',
                    'min(InvertedRecency)', 'max(InvertedRecency)',
                    '0.5 * (Frequency - MinFrequency) / (MaxFrequency - MinFrequency)',
                    '0.5 * (InvertedRecency - MinInvertedRecency) / (MaxInvertedRecency - MinInvertedRecency)',
                    'RecencyScore + FrequencyScore'
                ])
                for person in audience_sources_matched_persons:
                    relevant_data = [
                        person.email or '',
                        str(person.count) if person.count is not None else '',
                        str(person.count_min) if person.count_min is not None else '',
                        str(person.count_max) if person.count_max is not None else '',
                        str(person.start_date) if person.start_date is not None else '',
                        str(person.recency) if person.recency is not None else '',
                        str(person.recency_min) if person.recency_min is not None else '',
                        str(person.recency_max) if person.recency_max is not None else '',
                        str(person.inverted_recency) if person.inverted_recency is not None else '',
                        str(person.inverted_recency_min) if person.inverted_recency_min is not None else '',
                        str(person.inverted_recency_max) if person.inverted_recency_max is not None else '',
                        str(person.view_score) if person.view_score is not None else '',
                        str(person.recency_score) if person.recency_score is not None else '',
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
            "target_schema": payload.target_schema,
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
            'target_schema': source[2],
            'source_origin': source[3],
            'source_type': source[4],
            'created_at': source[6],
            'created_by': source[5],
            'domain': source[7],
            'total_records': source[8],
            'matched_records': source[9],
            'matched_records_status': source[10],
            'processed_records': source[11],
        }