import logging
from typing import List

from config.rmq_connection import (
    publish_rabbitmq_message_with_channel,
    RabbitMQConnection,
)
from models import LeadUser, IntegrationUserSync
from persistence.data_sync_imported_lead import DataSyncImportedPersistence
from persistence.user_persistence import UserPersistence
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class DataSyncImportedService:
    def __init__(
        self,
        data_sync_imported_persistence: DataSyncImportedPersistence,
        user_persistence: UserPersistence,
    ):
        self.data_sync_imported_persistence = data_sync_imported_persistence
        self.user_persistence = user_persistence
        self.CRON_DATA_SYNC_LEADS = "cron_data_sync_leads"
        self.rabbitmq_connection = RabbitMQConnection()
        self._channel = None

    async def _get_channel(self):
        if self._channel is None:
            rmq_connection = await self.rabbitmq_connection.connect()
            self._channel = await rmq_connection.channel()
        return self._channel

    async def send_leads_to_data_sync_queue(self, processed_lead: List[dict]):
        channel = await self._get_channel()
        await publish_rabbitmq_message_with_channel(
            channel=channel,
            queue_name=self.CRON_DATA_SYNC_LEADS,
            message_body=processed_lead,
        )

    async def get_sent_imported_lead(self):
        return (
            await self.data_sync_imported_persistence.get_sent_imported_lead()
        )

    async def save_and_send_data_imported_leads(
        self,
        lead_users: List[LeadUser],
        data_sync: IntegrationUserSync,
        user_integrations_service_name: str,
    ):
        lead_ids = [lead_user.id for lead_user in lead_users]
        users_id = lead_users[-1].user_id
        is_validation = (
            self.user_persistence.get_domain_is_email_validation_enabled(
                domain_id=data_sync.domain_id,
            )
        )
        data_sync_imported_ids = (
            await self.data_sync_imported_persistence.save_data_imported_leads(
                lead_ids=lead_ids,
                is_validation=is_validation,
                data_sync=data_sync,
                user_integrations_service_name=user_integrations_service_name,
            )
        )
        processed_lead = {
            "data_sync_id": data_sync.id,
            "data_sync_imported_ids": data_sync_imported_ids,
            "users_id": users_id,
            "service_name": user_integrations_service_name,
        }
        await self.send_leads_to_data_sync_queue(processed_lead=processed_lead)

    async def save_and_send_data_imported_leads_ch(
        self,
        ch_lead_ids: list[str],
        data_sync: IntegrationUserSync,
        user_integrations_service_name: str,
        users_id: int | None,
    ):
        """Same as save_and_send_data_imported_leads but for ClickHouse ids (UUID v1)."""
        is_validation = (
            self.user_persistence.get_domain_is_email_validation_enabled(
                domain_id=data_sync.domain_id,
            )
        )
        data_sync_imported_ids = await self.data_sync_imported_persistence.save_data_imported_leads_ch(
            ch_lead_ids=ch_lead_ids,
            is_validation=is_validation,
            data_sync=data_sync,
            user_integrations_service_name=user_integrations_service_name,
        )
        processed_lead = {
            "data_sync_id": data_sync.id,
            "data_sync_imported_ids": data_sync_imported_ids,
            "users_id": users_id,
            "service_name": user_integrations_service_name,
        }
        await self.send_leads_to_data_sync_queue(processed_lead=processed_lead)
