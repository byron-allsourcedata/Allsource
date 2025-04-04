import logging
import os
import sys
import asyncio
import functools
import json
from aio_pika import IncomingMessage
from sqlalchemy.orm import sessionmaker, Session, aliased
from sqlalchemy.sql import func
from dotenv import load_dotenv
from sqlalchemy import create_engine

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

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


def format_ids(ids):
    return tuple(ids) if ids else None


async def aud_smarts_reader(message: IncomingMessage, db_session: Session, connection):
    try:
        message_body = json.loads(message.body)
        data = message_body.get('data')

        user_id = data.get('user_id')
        aud_smart_id = str(data.get('aud_smart_id'))
        data_sources = data.get('data_sources')
        active_segment = data.get('active_segment')

        offset = 0

        AudienceLALP = aliased(AudienceLookALikePerson)
        AudienceSMP = aliased(AudienceSourcesMatchedPerson)
        
        includes_lookalikes = db_session.query(AudienceLALP.lookalike_id).filter(
            AudienceLALP.lookalike_id.in_(data_sources["lookalike_ids"]["include"])
        ).subquery()

        excludes_lookalikes = db_session.query(AudienceLALP.lookalike_id).filter(
            AudienceLALP.lookalike_id.in_(data_sources["lookalike_ids"]["exclude"])
        ).subquery()

        includes_sources = db_session.query(AudienceSMP.source_id).filter(
            AudienceSMP.source_id.in_(data_sources["source_ids"]["include"])
        ).subquery()

        excludes_sources = db_session.query(AudienceSMP.source_id).filter(
            AudienceSMP.source_id.in_(data_sources["source_ids"]["exclude"])
        ).subquery()
        

        while offset < active_segment:
            lalp_query = (
                db_session.query(AudienceLALP.enrichment_user_id.label("five_x_five_user_id"))
                .outerjoin(includes_lookalikes, AudienceLALP.lookalike_id == includes_lookalikes.c.lookalike_id)
                .outerjoin(excludes_lookalikes, AudienceLALP.lookalike_id == excludes_lookalikes.c.lookalike_id)
                .filter(includes_lookalikes.c.lookalike_id.isnot(None))
                .filter(excludes_lookalikes.c.lookalike_id.is_(None))
            )

            smp_query = (
                db_session.query(AudienceSMP.enrichment_user_id.label("five_x_five_user_id"))
                .outerjoin(includes_sources, AudienceSMP.source_id == includes_sources.c.source_id)
                .outerjoin(excludes_sources, AudienceSMP.source_id == excludes_sources.c.source_id)
                .filter(includes_sources.c.source_id.isnot(None))
                .filter(excludes_sources.c.source_id.is_(None))
            )

            combined_query = lalp_query.union(smp_query).subquery()

            final_query = (
                db_session.query(combined_query.c.five_x_five_user_id)
                .limit(min(SELECTED_ROW_COUNT, active_segment - offset))
                .offset(offset)
            )

            persons = [row[0] for row in final_query.all()]

            if not persons:
                break

            message_body = {
                'aud_smart_id': str(aud_smart_id),
                'user_id': user_id,
                'five_x_five_users_ids': [str(person_id) for person_id in persons]
            }
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=AUDIENCE_SMARTS_AGENT,
                message_body=message_body
            )
            logging.info(f"sent {len(persons)} persons")  

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