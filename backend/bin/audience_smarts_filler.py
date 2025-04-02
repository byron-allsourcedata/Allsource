import logging
import os
import sys
import asyncio
import functools
import json
import aioboto3
from aio_pika import IncomingMessage
from sqlalchemy.orm import sessionmaker, Session, aliased
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from models.audience_lookalikes_persons import AudienceLookALikePerson
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson

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

        AudienceLALP = aliased(AudienceLookALikePerson)
        AudienceSMP = aliased(AudienceSourcesMatchedPerson)

        lookalike_include = lookalike_include or None
        lookalike_exclude = lookalike_exclude or None
        source_include = source_include or None
        source_exclude = source_exclude or None

        while offset < active_segment:
            lalp_query = (
                db_session.query(AudienceLALP.five_x_five_user_id.label("five_x_five_user_id"))
                .filter(AudienceLALP.lookalike_id.in_(lookalike_include) if lookalike_include else True)
                .filter(~AudienceLALP.lookalike_id.in_(lookalike_exclude) if lookalike_exclude else True)
            )

            smp_query = (
                db_session.query(AudienceSMP.five_x_five_user_id.label("five_x_five_user_id"))
                .filter(AudienceSMP.source_id.in_(source_include) if source_include else True)
                .filter(~AudienceSMP.source_id.in_(source_exclude) if source_exclude else True)
            )

            combined_query = lalp_query.union_all(smp_query).subquery().alias("combined_persons")

            final_query = (
                db_session.query(combined_query.c.five_x_five_user_id)
                .limit(SELECTED_ROW_COUNT)
                .offset(offset)
            )

            persons = [row[0] for row in final_query.all()]

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