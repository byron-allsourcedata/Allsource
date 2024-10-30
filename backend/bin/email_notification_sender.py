import asyncio
import functools
import json
import logging
import os
import sys

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from config.rmq_connection import RabbitMQConnection
from dotenv import load_dotenv
from services.sendgrid import SendgridHandler

load_dotenv()
logging.basicConfig(level=logging.INFO)

EMAIL_NOTIFICATIONS = 'email_notifications'
TEMPLATE_ID = ''


async def on_message_received(message):
    try:
        message_json = json.loads(message.body)
        email = message_json.get('email')
        text = message_json.get('text')

        mail_object = SendgridHandler()
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=TEMPLATE_ID,
            template_placeholder={"text": text},
        )
        logging.info("Confirmation Email Sent")
        await message.ack()
    except Exception as e:
        logging.error("Error occurred while processing message.", exc_info=True)
        await asyncio.sleep(5)
        await message.reject(requeue=True)


async def main():
    logging.info("Started")
    rabbitmq_connection = None
    try:
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(
            name=EMAIL_NOTIFICATIONS,
            durable=True,
            arguments={
                'x-consumer-timeout': 3600000,
            }
        )
        await queue.consume(
            functools.partial(on_message_received)
        )
        await asyncio.Future()
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        if rabbitmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())
