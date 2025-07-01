import json
import logging

from aio_pika import Message
from pydantic import BaseModel

from config.rmq_connection import publish_rabbitmq_message_with_channel
from resolver import injectable
from schemas.scripts.audience_source import MessageBody


logger = logging.getLogger(__name__)


@injectable
class RabbitmqService:
    def __init__(self):
        pass

    async def publish_rabbitmq_message(
        self, connection, queue_name: str, message_body: MessageBody | dict
    ):
        channel = await connection.channel()

        try:
            if isinstance(message_body, BaseModel):
                dict_data = message_body.model_dump()
            else:
                dict_data = message_body

            json_data = json.dumps(dict_data).encode("utf-8")

            message = Message(body=json_data)
            await channel.default_exchange.publish(
                message, routing_key=queue_name
            )
        except Exception as e:
            logger.error(e)
            await channel.close()
        finally:
            await channel.close()


    async def publish_rabbitmq_message_with_channel(
        self, channel, queue_name: str, message_body: MessageBody | dict
    ):
        return await publish_rabbitmq_message_with_channel(
            channel=channel,
            queue_name=queue_name,
            message_body=message_body,
        )