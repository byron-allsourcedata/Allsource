import os
from aio_pika import connect, Message, DeliveryMode, Connection
import json

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

async def publish_rabbitmq_message(connection: Connection, queue_name: str, message_body: dict):
    channel = await connection.channel()
    queue = await channel.declare_queue(
        name=queue_name,
        auto_delete=True,
        exclusive=True
    )
    json_data = json.dumps(message_body).encode("utf-8")
    message = Message(
        body=json_data,
        delivery_mode=DeliveryMode.PERSISTENT
    )
    await channel.default_exchange.publish(message, routing_key=queue_name)
    await channel.close()
