import asyncio
import functools
import json
import logging
import os
import statistics
import sys
from asyncio import sleep

from aio_pika import IncomingMessage
from dotenv import load_dotenv


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)


from resolver import Resolver
from services.lookalikes import AudienceLookalikesService
from services.lookalike_filler import LookalikeFillerService

from db_dependencies import (
    Db
)

from services.similar_audiences.similar_audience_scores import SimilarAudiencesScoresService
from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message
)

from typing import (
    List,

)
from sqlalchemy.orm import Session


load_dotenv()

AUDIENCE_LOOKALIKES_MATCHING = 'audience_lookalikes_matching'
AUDIENCE_LOOKALIKES_READER = 'audience_lookalikes_reader'
SLEEP_INTERVAL = 60 * 10
SELECTED_ROW_COUNT = 500
AUDIENCE_LOOKALIKES_PROGRESS = "AUDIENCE_LOOKALIKES_PROGRESS"


def setup_logging(
    level
):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


async def send_sse(
    connection,
    user_id: int,
    data: dict
):
    try:
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


def get_max_size(
    lookalike_size: str
) -> int:
    if lookalike_size == 'almost_identical':
        size = 10000
    elif lookalike_size == 'extremely_similar':
        size = 50000
    elif lookalike_size == 'very_similar':
        size = 100000
    elif lookalike_size == 'quite_similar':
        size = 200000
    elif lookalike_size == 'broad':
        size = 500000
    else:
        logging.warning(f"Unknown lookalike size: {lookalike_size}, defaulted to 'broad' (500,000)")
        size = 500000

    return size


def get_similarity_score(scores: List[float]):
    if len(scores) > 0:
        return {
            "min": round(min(scores), 3),
            "max": round(max(scores), 3),
            "average": round(sum(scores) / len(scores), 3),
            "median": round(statistics.median(scores), 3),
        }
    else:
        return {
            "min": None,
            "max": None,
            "average": None,
            "median": None,
        }

async def aud_sources_reader(
    message: IncomingMessage,
    db_session: Session,
    connection,
    similar_audiences_scores: SimilarAudiencesScoresService,
    lookalikes: AudienceLookalikesService,
    filler: LookalikeFillerService
):
    await sleep(1)
    try:
        message_body = json.loads(message.body)
        lookalike_id = message_body.get('lookalike_id')

        audience_lookalike = lookalikes.get_lookalike(lookalike_id)
        if not audience_lookalike:
            logging.info(f"audience_lookalike with id {lookalike_id} not found")
            await message.ack()
            return

        total_rows = get_max_size(audience_lookalike.lookalike_size)
        filler.process_lookalike_pipeline(audience_lookalike=audience_lookalike)

        enrichment_lookalike_scores = similar_audiences_scores.get_lookalike_scores(
            source_uuid=audience_lookalike.source_uuid,
            lookalike_id=lookalike_id,
            total_rows=total_rows
        )

        logging.info(f"Total rows in pixel file: {len(enrichment_lookalike_scores)}")
        audience_lookalike.size = len(enrichment_lookalike_scores)
        scores = [float(score) for (user_id, score) in enrichment_lookalike_scores if score is not None]
        similarity_score = get_similarity_score(scores)
        audience_lookalike.similarity_score = similarity_score
        db_session.add(audience_lookalike)
        db_session.flush()
        await send_sse(
            connection, audience_lookalike.user_id,
            {"lookalike_id": str(audience_lookalike.id), "total": total_rows, "processed": 0}
        )

        if not enrichment_lookalike_scores:
            await message.ack()
            return

        persons = [str(user_id) for (user_id, score) in
            enrichment_lookalike_scores]

        message_body = {
            'lookalike_id': str(audience_lookalike.id),
            'user_id': audience_lookalike.user_id,
            'enrichment_user': persons
        }

        await publish_rabbitmq_message(
            connection=connection, queue_name=AUDIENCE_LOOKALIKES_MATCHING, message_body=message_body
        )

        db_session.commit()
        await message.ack()
    except BaseException as e:
        db_session.rollback()
        logging.error(f"Error processing message: {e}", exc_info=True)
        await message.reject(requeue=True)


async def main():
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == 'DEBUG':
            log_level = logging.DEBUG
        elif arg != 'INFO':
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")

    setup_logging(log_level)

    try:
        resolver = Resolver()
        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        db_session = await resolver.resolve(Db)
        similar_audiences_scores_service = await resolver.resolve(SimilarAudiencesScoresService)
        lookalikes = await resolver.resolve(AudienceLookalikesService)
        filler = await resolver.resolve(LookalikeFillerService)

        reader_queue = await channel.declare_queue(
            name=AUDIENCE_LOOKALIKES_READER,
            durable=True,
            arguments={
                'x-consumer-timeout': 14400000,
            }
        )

        logging.info("audience lookalike filler started")
        await reader_queue.consume(
            functools.partial(
                aud_sources_reader,
                db_session=db_session,
                connection=connection,
                similar_audiences_scores=similar_audiences_scores_service,
                lookalikes=lookalikes,
                filler=filler
            )
        )

        await asyncio.Future()
        await resolver.cleanup()

    except BaseException:
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
