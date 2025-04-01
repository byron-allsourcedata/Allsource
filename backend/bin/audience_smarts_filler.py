import logging
import os
import sys
import asyncio
import functools
import json
import aioboto3
from aio_pika import IncomingMessage
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from sqlalchemy import create_engine
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)


load_dotenv()

AUDIENCE_SMARTS_AGENT = 'aud_smarts_agent'
AUDIENCE_SMARTS_FILLER = 'aud_smarts_filler'
SELECTED_ROW_COUNT = 1000
AUDIENCE_SMARTS_PROGRESS = "AUDIENCE_SMARTS_PROGRESS"

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


async def send_sse(connection, user_id: int, data: dict):
    try:
        logging.info(f"send client throught SSE: {data, user_id}")
        await publish_rabbitmq_message(
            connection=connection,
            queue_name=f'sse_events_{str(user_id)}',
            message_body={
                "status": AUDIENCE_SMARTS_PROGRESS,
                "data": data
            }
        )
    except Exception as e:
        logging.error(f"Error sending SSE: {e}")


def format_ids(ids):
    return tuple(ids) if ids else ('NULL',)


async def aud_smarts_reader(message: IncomingMessage, db_session: Session, connection):
    try:
        message_body = json.loads(message.body)
        data = message_body.get('data')

        user_id = data.get('user_id')
        aud_smart_id = str(data.get('aud_smart_id'))
        data_sources = data.get('data_sources')
        active_segment = data.get('active_segment')

        offset = 0

        lookalike_include = format_ids(data_sources["lookalike_ids"]["include"])
        lookalike_exclude = format_ids(data_sources["lookalike_ids"]["exclude"])
        source_include = format_ids(data_sources["source_ids"]["include"])
        source_exclude = format_ids(data_sources["source_ids"]["exclude"])
        
        while offset < active_segment:
            sql_query = """
            WITH CombinedPersons AS (
                SELECT five_x_five_user_id FROM AudienceLookALikePerson
                WHERE lookalike_id IN :include_lookalike_ids
                  AND lookalike_id NOT IN :exclude_lookalike_ids
                UNION
                SELECT five_x_five_user_id FROM AudienceSourcesMatchedPerson
                WHERE source_id IN :include_source_ids
                  AND source_id NOT IN :exclude_source_ids
            )
            SELECT five_x_five_user_id FROM CombinedPersons
            LIMIT :batch_size OFFSET :offset;
            """

            persons = db_session.execute(
                sql_query,
                {
                    "include_lookalike_ids": lookalike_include,
                    "exclude_lookalike_ids": lookalike_exclude,
                    "include_source_ids": source_include,
                    "exclude_source_ids": source_exclude,
                    "batch_size": SELECTED_ROW_COUNT,
                    "offset": offset,
                }
            ).fetchall()

            persons = [row[0] for row in persons]

            if not persons:
                break

            message_body = {
                'aud_smart_id': aud_smart_id,
                'user_id': user_id,
                'five_x_five_users_ids': persons
            }
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=AUDIENCE_SMARTS_AGENT,
                message_body=message_body
            )

            offset += SELECTED_ROW_COUNT

        await message.ack()
    except BaseException as e:
        db_session.rollback()
        logging.error(f"Error processing message: {e}", exc_info=True)
        await message.ack()


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
        s3_session = aioboto3.Session()
        
        reader_queue = await channel.declare_queue(
            name=AUDIENCE_SMARTS_FILLER,
            durable=True,
        )
        await reader_queue.consume(functools.partial(aud_smarts_reader, db_session=db_session, connection=connection))

        await asyncio.Future()

    except Exception:
        db_session.rollback()
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