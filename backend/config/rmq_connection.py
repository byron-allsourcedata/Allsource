import os
from typing import Union

from aio_pika import connect, Message, DeliveryMode, Connection
import json
import logging

from pydantic import BaseModel

from schemas.scripts.audience_source import MessageBody

logger = logging.getLogger(__name__)

aio_pika_logger = logging.getLogger('aio_pika')
aio_pika_logger.setLevel(logging.WARNING)


class RabbitMQConnection:
    def __init__(self):
        self._connection = None

    async def connect(self):
        self._connection = await connect(
            host=os.getenv('RABBITMQ_HOST'),
            port=int(os.getenv('RABBITMQ_PORT')),
            virtualhost=os.getenv('RABBITMQ_VIRTUALHOST'),
            login=os.getenv('RABBITMQ_LOGIN'),
            password=os.getenv('RABBITMQ_PASSWORD'),
            timeout=5000,
        )
        return self._connection

    async def close(self):
        if self._connection:
            await self._connection.close()


async def publish_rabbitmq_message(connection, queue_name: str, message_body: Union[MessageBody, dict]):
    channel = await connection.channel()

    try:
        if isinstance(message_body, BaseModel):
            json_data = json.dumps(message_body.model_dump()).encode("utf-8")
        else:
            json_data = json.dumps(message_body).encode("utf-8")

        message = Message(body=json_data)
        await channel.default_exchange.publish(message, routing_key=queue_name)
    except Exception as e:
        logger.error(e)
        await channel.close()
    finally:
        await channel.close()
        
async def publish_rabbitmq_message_with_channel(channel, queue_name: str, message_body: Union[MessageBody, dict]):
    try:
        if isinstance(message_body, BaseModel):
            json_data = json.dumps(message_body.model_dump()).encode("utf-8")
        else:
            json_data = json.dumps(message_body).encode("utf-8")

        message = Message(body=json_data)
        await channel.default_exchange.publish(message, routing_key=queue_name)
    except Exception as e:
        logger.error(e)
        