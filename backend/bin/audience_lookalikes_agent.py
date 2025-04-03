import logging
import os
import sys
import asyncio
import functools
import json
import boto3
from sqlalchemy import update
from aio_pika import IncomingMessage
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.audience_lookalikes import AudienceLookalikes
from models.audience_lookalikes_persons import AudienceLookALikePerson
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_LOOKALIKES_MATCHING= 'audience_lookalikes_matching'
AUDIENCE_LOOKALIKES_PROGRESS = "AUDIENCE_LOOKALIKES_PROGRESS"

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
async def send_sse(connection, user_id: int, data: dict):
    try:
        print(f"userd_id = {user_id}")
        logging.info(f"send client throught SSE: {data, user_id}")
        await publish_rabbitmq_message(
                    connection=connection,
                    queue_name=f'sse_events_{str(user_id)}',
                    message_body={
                        "status": AUDIENCE_LOOKALIKES_PROGRESS,
                        "data": data
                    }
                )
    except Exception as e:
        logging.error(f"Error sending SSE: {e}")

async def aud_sources_matching(message: IncomingMessage, db_session: Session, connection):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        lookalike_id = message_body.get("lookalike_id")
        five_x_five_users_ids = message_body.get("five_x_five_users_ids")
        logging.info(f"Processing lookalike_id with ID: {lookalike_id}")
        logging.info(f"Processing len: {len(five_x_five_users_ids)}")
        
        for five_x_five_user_id in five_x_five_users_ids:
            matched_person = AudienceLookALikePerson(
                lookalike_id=lookalike_id,
                five_x_five_user_id=five_x_five_user_id
            )
            db_session.add(matched_person)
            
        db_session.flush()

        processed_size, total_records = db_session.execute(
            update(AudienceLookalikes)
            .where(AudienceLookalikes.id == lookalike_id)
            .values(
                processed_size=AudienceLookalikes.processed_size + len(five_x_five_users_ids)
            )
            .returning(AudienceLookalikes.processed_size, AudienceLookalikes.size)
        ).fetchone()
                    
        db_session.commit()
            
        await send_sse(connection, user_id, {"lookalike_id": lookalike_id, "total": total_records, "processed": processed_size})
        logging.info(f"ack")
        await message.ack()

    except BaseException as e:
        logging.error(f"Error processing matching: {e}", exc_info=True)
        await message.ack()
        db_session.rollback()

async def main():
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == 'DEBUG':
            log_level = logging.DEBUG
        elif arg != 'INFO':
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")
    
    setup_logging(log_level)
    db_username = os.getenv('DB_USERNAME')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')

    try:
        logging.info("Starting processing...")
        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        engine = create_engine(
            f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()

        queue = await channel.declare_queue(
            name=AUDIENCE_LOOKALIKES_MATCHING,
            durable=True,
        )
        await queue.consume(
                functools.partial(aud_sources_matching, connection=connection, db_session=db_session)
            )

        await asyncio.Future()

    except Exception:
        logging.error('Unhandled Exception:', exc_info=True)

    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        if rmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rmq_connection.close()
        logging.info("Shutting down...")

if __name__ == "__main__":
    asyncio.run(main())