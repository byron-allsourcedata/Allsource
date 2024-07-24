import json
import os
from aio_pika import connect, Connection, Channel, Message, DeliveryMode
from typing import Dict, Set

class RabbitMQConnectionSingleton:
    _instance: Connection = None

    @classmethod
    async def get_connection(cls) -> Connection:
        if cls._instance is None:
            cls._instance = await connect(
                host=os.getenv('RABBITMQ_HOST'),
                port=int(os.getenv('RABBITMQ_PORT')),
                virtualhost=os.getenv('RABBITMQ_VIRTUALHOST'),
                login=os.getenv('RABBITMQ_LOGIN'),
                password=os.getenv('RABBITMQ_PASSWORD'),
                timeout=5000,
            )
        return cls._instance

    @classmethod
    async def close_connection(cls):
        if cls._instance:
            await cls._instance.close()
            cls._instance = None

# Track active channels and queues
active_channels: Dict[str, Set[Channel]] = {}



async def close_channel(queue_name: str, channel: Channel):
    print(0)
    if queue_name in active_channels:
        print(1)
        if channel in active_channels[queue_name]:
            print(2)
            active_channels[queue_name].remove(channel)
            await channel.close()  # Ensure the channel is closed
            if channel.is_closed:
                print(3)
                if not active_channels[queue_name]:
                    print(4)
                    # No active channels left for this queue
                    del active_channels[queue_name]
                    connection = await RabbitMQConnectionSingleton.get_connection()
                    async with connection.channel() as ch:
                        try:
                            await ch.queue_delete(queue_name)
                            print(f"Queue {queue_name} deleted")
                        except Exception as e:
                            print(f"Failed to delete queue {queue_name}: {e}")
            else:
                print(f"Channel for {queue_name} did not close properly.")
        else:
            print(f"Channel for {queue_name} not found in active channels.")
    else:
        print(f"Queue {queue_name} not found in active_channels.")

async def publish_rabbitmq_message(queue_name: str, message_body: dict):
    channel = await get_channel(queue_name)
    try:
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
    except Exception as err:
        await channel.close()
    finally:
        await channel.close()
