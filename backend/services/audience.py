import logging

from enums import AudienceInfoEnum
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from persistence.audience_persistence import AudiencePersistence

logger = logging.getLogger(__name__)


class AudienceService:
    def __init__(self, audience_persistence_service: AudiencePersistence):
        self.audience_persistence_service = audience_persistence_service
        self.AUDIENCE_SYNC = 'audience_sync'

    def get_user_audience_list(self):
        return self.audience_persistence_service.get_user_audience_list(self.user.get('id'))

    async def create_audience(self, domain_id: int, data_source: str, audience_type: str, audience_threshold: int):
        self.audience_persistence_service.create_domain_audience(domain_id, data_source, audience_type, audience_threshold)
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        try:
            message_text = {
                'domain_id': domain_id,
                'data_source': data_source,
                'audience_type': audience_type,
                'audience_threshold': audience_threshold
            }
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=self.AUDIENCE_SYNC,
                message_body=message_text
            )
        except:
            await rabbitmq_connection.close()
            return AudienceInfoEnum.ERROR_SEND_AUDIENCE
        finally:
            await rabbitmq_connection.close()
            return AudienceInfoEnum.SUCCESS

    def delete_audience(self, audience_ids):
        for audience_id in audience_ids:
            self.audience_persistence_service.delete_user_audience(self.user.get('id'), audience_id)
        return AudienceInfoEnum.SUCCESS
