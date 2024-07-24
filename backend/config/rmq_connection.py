import json
import os
import pika
from typing import Dict, Set

class RabbitMQConnectionSingleton:
    _instance = None

    @classmethod
    def get_connection(cls):
        if cls._instance is None:
            parameters = pika.ConnectionParameters(
                host=os.getenv('RABBITMQ_HOST'),
                port=int(os.getenv('RABBITMQ_PORT')),
                virtual_host=os.getenv('RABBITMQ_VIRTUALHOST'),
                credentials=pika.PlainCredentials(
                    os.getenv('RABBITMQ_LOGIN'),
                    os.getenv('RABBITMQ_PASSWORD')
                )
            )
            cls._instance = pika.BlockingConnection(parameters)
        return cls._instance

    @classmethod
    def close_connection(cls):
        if cls._instance:
            cls._instance.close()
            cls._instance = None

# Track active channels and queues
active_channels: Dict[str, Set[pika.channel.Channel]] = {}

def close_channel(queue_name: str, channel: pika.channel.Channel):
    print(0)
    if queue_name in active_channels:
        print(1)
        if channel in active_channels[queue_name]:
            print(2)
            active_channels[queue_name].remove(channel)
            channel.close()  # Ensure the channel is closed
            if channel.is_closed:
                print(3)
                if not active_channels[queue_name]:
                    print(4)
                    # No active channels left for this queue
                    del active_channels[queue_name]
                    connection = RabbitMQConnectionSingleton.get_connection()
                    try:
                        ch = connection.channel()
                        ch.queue_delete(queue=queue_name)
                        print(f"Queue {queue_name} deleted")
                    except Exception as e:
                        print(f"Failed to delete queue {queue_name}: {e}")
            else:
                print(f"Channel for {queue_name} did not close properly.")
        else:
            print(f"Channel for {queue_name} not found in active channels.")
    else:
        print(f"Queue {queue_name} not found in active_channels.")

def publish_rabbitmq_message(queue_name: str, message_body: dict):
    connection = RabbitMQConnectionSingleton.get_connection()
    channel = connection.channel()
    try:
        queue = channel.queue_declare(
            queue=queue_name,
            auto_delete=True,
            exclusive=True
        )
        json_data = json.dumps(message_body).encode("utf-8")
        channel.basic_publish(
            exchange='',
            routing_key=queue_name,
            body=json_data,
            properties=pika.BasicProperties(
                delivery_mode=2  # Persistent message
            )
        )
        channel.close()
    except Exception as err:
        channel.close()
    finally:
        channel.close()
