import asyncio
import functools
import json
import logging
import os
import statistics
import sys
from abc import (
    ABC,
    abstractmethod
)
from uuid import UUID

from aio_pika import IncomingMessage
from clickhouse_connect.driver.common import StreamContext
from clickhouse_connect.driver.query import QueryResult
from dotenv import load_dotenv
from sqlalchemy import (
    desc,
    select
)
from sqlalchemy.orm import sessionmaker


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from config import ClickhouseConfig
from dependencies import (
    Clickhouse,
    Db
)
from services.similar_audiences.column_selector import AudienceColumnSelector


from schemas.similar_audiences import NormalizationConfig
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from services.similar_audiences.similar_audience_scores import SimilarAudiencesScoresService
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService
from services.similar_audiences import SimilarAudienceService
from models.audience_sources import AudienceSource
from models.audience_lookalikes_persons import AudienceLookalikes
from models import (
    EnrichmentEmploymentHistory,
    EnrichmentProfessionalProfile
)
from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message
)
from persistence.enrichment_lookalike_scores import EnrichmentLookalikeScoresPersistence
from persistence.enrichment_models import EnrichmentModelsPersistence
from typing import (
    Dict,
    List,
    Tuple,
    Any
)
from decimal import Decimal
from sqlalchemy import (
    create_engine,
    cast,
    String
)
from sqlalchemy.orm import Session
from models.enrichment import (
    EnrichmentUser,
    EnrichmentPersonalProfiles,
    EnrichmentFinancialRecord,
    EnrichmentLifestyle,
    EnrichmentVoterRecord,
    EnrichmentLookalikeScore
)

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
    lookalike_size
):
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

    return size



class ProfileFetcher(ABC):
    @abstractmethod
    def fetch_profiles(self, selected_columns: List[str],asids: List[str]) -> List[dict]:
        pass

    @abstractmethod
    def fetch_profiles_from_lookalike(self, audience_lookalike: AudienceLookalikes) -> List[dict]:
        pass


class ClickhouseProfileFetcher(ProfileFetcher):
    def __init__(
        self,
        db: Db,
        clickhouse: Clickhouse,
        column_selector: AudienceColumnSelector
    ):
        self.db = db
        self.clickhouse = clickhouse
        self.column_selector = column_selector


    def fetch_profiles(
        self,
        selected_columns: List[str],
        asids: List[UUID]
    ) -> List[dict]:
        columns = ", ".join(selected_columns)
        query = f"SELECT {columns} FROM enrichment_users WHERE asid IN %(asids)s"
        result = self.clickhouse.query(
            query, parameters={
                "asids": asids
            }
        )

        return parse_clickhouse_result(result)


    def fetch_profiles_from_lookalike(self, audience_lookalike: AudienceLookalikes) -> List[dict]:
        column_names = self.column_selector.clickhouse_columns(audience_lookalike.significant_fields)

        asids = get_user_asids_for(self.db, audience_lookalike.source_uuid)

        return self.fetch_profiles(column_names, asids)


def build_dynamic_query_and_config(
    db_session: Session,
    column_selector: AudienceColumnSelector,
    sig: Dict[str, float]
) -> Tuple:
    column_map = column_selector.get_enrichment_user_column_map()
    for key in ['job_title', 'company_name', 'start_date', 'end_date', 'is_current', 'location', 'job_description',
        'party_affiliation', 'congressional_district', 'voting_propensity']:
        column_map.pop(key, None)
    employment_subq = (
        db_session
        .query(
            EnrichmentEmploymentHistory.asid.label('asid'),
            EnrichmentEmploymentHistory.job_title.label('job_title'),
            EnrichmentEmploymentHistory.company_name.label('company_name'),
            EnrichmentEmploymentHistory.start_date.label('start_date'),
            EnrichmentEmploymentHistory.end_date.label('end_date'),
            EnrichmentEmploymentHistory.is_current.label('is_current'),
            EnrichmentEmploymentHistory.location.label('location'),
            EnrichmentEmploymentHistory.job_description.label('job_description')
        )
        .filter(EnrichmentEmploymentHistory.is_current == True)
        .distinct(EnrichmentEmploymentHistory.asid)
        .subquery('emp_curr')
    )
    voter_subq = (
        db_session
        .query(
            EnrichmentVoterRecord.asid.label('asid'),
            EnrichmentVoterRecord.party_affiliation.label('party_affiliation'),
            EnrichmentVoterRecord.congressional_district.label('congressional_district'),
            EnrichmentVoterRecord.voting_propensity.label('voting_propensity')
        )
        .distinct(EnrichmentVoterRecord.asid)
        .subquery('voter_curr')
    )

    column_map.update(
        {
            'job_title': employment_subq.c.job_title,
            'company_name': employment_subq.c.company_name,
            'start_date': employment_subq.c.start_date,
            'end_date': employment_subq.c.end_date,
            'is_current': employment_subq.c.is_current,
            'location': employment_subq.c.location,
            'job_description': employment_subq.c.job_description,
            'party_affiliation': voter_subq.c.party_affiliation,
            'congressional_district': voter_subq.c.congressional_district,
            'voting_propensity': voter_subq.c.voting_propensity,
        }
    )

    selected_fields = [name for name in sig.keys() if name in column_map]
    dynamic_columns = [column_map[name] for name in selected_fields]
    select_columns = [
        EnrichmentUser.id.label("EnrichmentUser"),
        *dynamic_columns
    ]
    unordered = [f for f in selected_fields if f != "zip_code5"]

    query = (
        db_session
        .query(*select_columns)
        .select_from(EnrichmentUser)
        .outerjoin(
            EnrichmentPersonalProfiles,
            EnrichmentPersonalProfiles.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentFinancialRecord,
            EnrichmentFinancialRecord.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentLifestyle,
            EnrichmentLifestyle.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentProfessionalProfile,
            EnrichmentProfessionalProfile.asid == EnrichmentUser.asid
        )
        .outerjoin(
            employment_subq,
            employment_subq.c.asid == EnrichmentUser.asid
        )
        .outerjoin(
            voter_subq,
            voter_subq.c.asid == EnrichmentUser.asid
        )
    )

    normalization_config = NormalizationConfig(
        numerical_features=[],
        ordered_features={},
        unordered_features=unordered
    )

    return query, normalization_config


# TODO: rename
def get_user_asids_for(db: Session, source_id: UUID) -> List[UUID]:
    query = (
        select(EnrichmentUser.asid)
        .select_from(AudienceSource)
        .join(
            AudienceSourcesMatchedPerson,
            AudienceSourcesMatchedPerson.source_id == AudienceSource.id
        )
        .join(
            EnrichmentUser,
            EnrichmentUser.id == AudienceSourcesMatchedPerson.enrichment_user_id
        )
        .where(AudienceSource.id == source_id)
    )

    return [row for row in db.execute(query).scalars()]


def parse_clickhouse_result(clickhouse_result: QueryResult) -> List[dict]:
    column_names = clickhouse_result.column_names
    rows = clickhouse_result.result_rows
    return [dict(zip(column_names, row)) for row in rows]

def fetch_clickhouse_user_profiles(
    db: Session,
    clickhouse: Clickhouse,
    audience_lookalike: AudienceLookalikes,
    column_selector: AudienceColumnSelector
) -> List[Dict]:
    select_cols = column_selector.cols(
        audience_lookalike
    )

    asids = get_user_asids_for(db, audience_lookalike.source_uuid)
    columns = ", ".join(select_cols)
    query = f"SELECT {columns} FROM enrichment_users WHERE asid IN %(asids)s"
    result = clickhouse.query(
        query, parameters={
            "asids": asids
        }
    )

    return parse_clickhouse_result(result)


def fetch_user_profiles(
    db_session: Session,
    audience_lookalike: AudienceLookalikes,
    column_selector: AudienceColumnSelector
) -> List[Dict]:
    select_cols = column_selector.cols(audience_lookalike)

    rows = (
        db_session.query(*select_cols)
        .select_from(AudienceSource)
        .join(
            AudienceSourcesMatchedPerson,
            AudienceSourcesMatchedPerson.source_id == AudienceSource.id
        )
        .join(
            EnrichmentUser,
            EnrichmentUser.id == AudienceSourcesMatchedPerson.enrichment_user_id
        )
        .outerjoin(
            EnrichmentPersonalProfiles,
            EnrichmentPersonalProfiles.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentFinancialRecord,
            EnrichmentFinancialRecord.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentLifestyle,
            EnrichmentLifestyle.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentVoterRecord,
            EnrichmentVoterRecord.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentEmploymentHistory,
            EnrichmentEmploymentHistory.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentProfessionalProfile,
            EnrichmentProfessionalProfile.asid == EnrichmentUser.asid
        )
        .filter(AudienceSource.id == audience_lookalike.source_uuid)
        .all()
    )
    profiles: List[Dict] = []
    for row in rows:
        data_kwargs = {}
        for label, value in row._mapping.items():
            if label == "customer_value":
                data_kwargs[label] = Decimal(str(value))
            else:
                data_kwargs[label] = str(value)

        profiles.append(data_kwargs)

    return profiles


def train_and_save_model(
    lookalike_id: int,
    user_profiles: List[Dict],
    config: NormalizationConfig,
    similar_audiences_scores_service: SimilarAudiencesScoresService,
    similar_audience_service: SimilarAudienceService
):
    dict_enrichment = [
        {k: str(v) if v is not None else "None" for k, v in profile.items()}
        for profile in user_profiles
    ]
    trained = similar_audience_service.get_trained_model(dict_enrichment, config)
    model = trained[0] if isinstance(trained, (tuple, list)) else trained
    similar_audiences_scores_service.save_enrichment_model(
        lookalike_id=lookalike_id,
        model=model
    )
    return model


def get_enrichment_users(
    clickhouse: Clickhouse
) -> Tuple[StreamContext, List[str]]:
    """
        Returns a stream of blocks of enrichment users and a list of column names
    """
    rows_stream = clickhouse.query_row_block_stream(
        "SELECT * FROM enrichment_users"
    )
    column_names = rows_stream.source.column_names

    return rows_stream, column_names


def fetch_enrichment_user_ids(
    db: Session,
    asids: List[str]
) -> List[UUID]:
    query = select(
        EnrichmentUser
    ).where(EnrichmentUser.asid.in_(asids))
    rows = db.execute(query).scalars()

    return [row.id for row in rows]


def calculate_and_store_scores(
    clickhouse: Clickhouse,
    db: Session,
    model,
    lookalike_id: UUID,
    audiences_scores: SimilarAudiencesScoresService
):
    rows_stream, column_names = get_enrichment_users(clickhouse)
    with rows_stream:
        for batch in rows_stream:
            dict_batch = [dict(zip(column_names, row)) for row in batch]
            asids = [doc["asid"] for doc in dict_batch]
            enrichment_user_ids = fetch_enrichment_user_ids(db, asids)

            audiences_scores.calculate_batch_scores(
                model=model,
                enrichment_user_ids=enrichment_user_ids,
                lookalike_id=lookalike_id,
                batch=dict_batch,
            )


def process_lookalike_pipeline(
    db_session: Session,
    clickhouse: Clickhouse,
    audience_lookalike: AudienceLookalikes,
    column_selector: AudienceColumnSelector,
    similar_audiences_scores_service: SimilarAudiencesScoresService,
    similar_audience_service: SimilarAudienceService,
    profile_fetcher: ProfileFetcher
):
    sig = audience_lookalike.significant_fields or {}
    query, config = build_dynamic_query_and_config(db_session, column_selector, sig)
    profiles = profile_fetcher.fetch_profiles_from_lookalike(audience_lookalike)

    model = train_and_save_model(
        lookalike_id=audience_lookalike.id,
        user_profiles=profiles,
        config=config,
        similar_audiences_scores_service=similar_audiences_scores_service,
        similar_audience_service=similar_audience_service
    )
    calculate_and_store_scores(
        db=db_session,
        clickhouse=clickhouse,
        model=model,
        lookalike_id=audience_lookalike.id,
        audiences_scores=similar_audiences_scores_service
    )


async def aud_sources_reader(
    message: IncomingMessage,
    db_session: Session,
    connection,
    similar_audiences_scores_service: SimilarAudiencesScoresService,
    similar_audience_service: SimilarAudienceService,
    column_selector: AudienceColumnSelector,
    clickhouse: Clickhouse,
    profile_fetcher: ProfileFetcher
):
    try:
        message_body = json.loads(message.body)
        lookalike_id = message_body.get('lookalike_id')

        audience_lookalike = db_session.query(AudienceLookalikes).filter(AudienceLookalikes.id == lookalike_id).first()
        if not audience_lookalike:
            logging.info(f"audience_lookalike with id {lookalike_id} not found")
            await message.ack()
            return

        total_rows = get_max_size(audience_lookalike.lookalike_size)
        process_lookalike_pipeline(
            db_session=db_session,
            audience_lookalike=audience_lookalike,
            similar_audiences_scores_service=similar_audiences_scores_service,
            similar_audience_service=similar_audience_service,
            column_selector=column_selector,
            clickhouse=clickhouse,
            profile_fetcher=profile_fetcher
        )

        source_uid_select = (
            select(AudienceSourcesMatchedPerson.enrichment_user_id)
            .where(AudienceSourcesMatchedPerson.source_id == audience_lookalike.source_uuid)
        )

        enrichment_lookalike_scores = (
            db_session.query(
                EnrichmentLookalikeScore.enrichment_user_id,
                EnrichmentLookalikeScore.score
            )
            .filter(
                EnrichmentLookalikeScore.lookalike_id == lookalike_id,
                ~EnrichmentLookalikeScore.enrichment_user_id.in_(source_uid_select)
            )
            .order_by(desc(EnrichmentLookalikeScore.score))
            .limit(total_rows)
            .all()
        )

        logging.info(f"Total row in pixel file: {len(enrichment_lookalike_scores)}")
        audience_lookalike.size = len(enrichment_lookalike_scores)
        scores = [float(s.score) for s in enrichment_lookalike_scores if s.score is not None]
        if scores:
            similarity_score = {
                "min": round(min(scores), 3),
                "max": round(max(scores), 3),
                "average": round(sum(scores) / len(scores), 3),
                "median": round(statistics.median(scores), 3),
            }
        else:
            similarity_score = {
                "min": None,
                "max": None,
                "average": None,
                "median": None,
            }
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

        persons = [str(enrichment_lookalike_score.enrichment_user_id) for enrichment_lookalike_score in
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
    db_username = os.getenv('DB_USERNAME')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')

    try:
        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        clickhouse = ClickhouseConfig.get_client()


        engine = create_engine(
            f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()
        audience_data_normalization_service = AudienceDataNormalizationService()
        column_selector = AudienceColumnSelector()
        profile_fetcher = ClickhouseProfileFetcher(
            db=db_session,
            clickhouse=clickhouse,
            column_selector=column_selector
        )
        similar_audience_service = SimilarAudienceService(
            audience_data_normalization_service=audience_data_normalization_service
        )
        similar_audiences_scores_service = SimilarAudiencesScoresService(
            normalization_service=audience_data_normalization_service, db=db_session,
            enrichment_models_persistence=EnrichmentModelsPersistence(db=db_session),
            enrichment_lookalike_scores_persistence=EnrichmentLookalikeScoresPersistence(db=db_session)
        )

        reader_queue = await channel.declare_queue(
            name=AUDIENCE_LOOKALIKES_READER,
            durable=True,
            arguments={
                'x-consumer-timeout': 14400000,
            }
        )
        await reader_queue.consume(
            functools.partial(
                aud_sources_reader,
                db_session=db_session,
                connection=connection,
                similar_audience_service=similar_audience_service,
                similar_audiences_scores_service=similar_audiences_scores_service,
                column_selector=column_selector,
                clickhouse=clickhouse,
                profile_fetcher=profile_fetcher
            )
        )

        await asyncio.Future()

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
