from datetime import datetime, timezone
import uuid
import logging
import os
from sqlalchemy import create_engine, func, TIMESTAMP, VARCHAR
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, text
from sqlalchemy.dialects.postgresql import UUID
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

Base = declarative_base()


class EnrichmentAsid(Base):
    __tablename__ = "enrichment_asids"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    asid = Column(UUID(as_uuid=True), nullable=False, unique=True)


class AudienceSourcesMatchedPerson(Base):
    __tablename__ = "audience_sources_matched_persons"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    source_id = Column(UUID(as_uuid=True), nullable=False)
    enrichment_user_asid = Column(UUID(as_uuid=True), nullable=True)
    name = Column(VARCHAR(128), nullable=True)
    created_at = Column(
        TIMESTAMP,
        nullable=True,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )


class AudienceLookalikesPerson(Base):
    __tablename__ = "audience_lookalikes_persons"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    lookalike_id = Column(UUID(as_uuid=True), nullable=False)
    enrichment_user_asid = Column(UUID(as_uuid=True), nullable=True)
    name = Column(VARCHAR(128), nullable=True)
    created_at = Column(
        TIMESTAMP,
        nullable=True,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )


def populate_enrichment_asids(session, count: int):
    logging.info(f"Inserting {count} random ASIDs into enrichment_asids...")
    rows = [EnrichmentAsid(asid=uuid.uuid4()) for _ in range(count)]
    session.bulk_save_objects(rows)
    session.commit()
    logging.info("ASIDs inserted.")


def insert_test_data(db_session, *, lookalike_rows=None, source_rows=None):
    lookalike_rows = lookalike_rows or []
    source_rows = source_rows or []

    if lookalike_rows:
        db_session.bulk_insert_mappings(
            AudienceLookalikesPerson,
            [
                {
                    "enrichment_user_asid": asid,
                    "lookalike_id": lid,
                    "name": name,
                }
                for asid, lid, name in lookalike_rows
            ],
        )

    if source_rows:
        db_session.bulk_insert_mappings(
            AudienceSourcesMatchedPerson,
            [
                {"enrichment_user_asid": asid, "source_id": sid, "name": name}
                for asid, sid, name in source_rows
            ],
        )

    db_session.commit()


def create_multiple_sources_and_lookalikes_with_overlap(
    session,
    source_ids: list[uuid.UUID],
    lookalike_ids: list[uuid.UUID],
    total: int,
    shared_count: int,
    name: str,
):
    """
    Creates test data with multiple source_id and lookalike_id,
    with a certain number of shared enrichment_user_asid.

    :param session: DB session
    :param source_ids: list of UUIDs for audience_sources_matched_persons
    :param lookalike_ids: list of UUIDs for audience_lookalikes_persons
    :param total: total number of ASIDs available for fetching
    :param shared_count: number of ASIDs that will be shared by all
    """

    common_count = len(source_ids) + len(lookalike_ids)

    assert shared_count * common_count <= total, (
        "shared_count too high — must leave room for unique entries: "
        "total must be >= 2 * shared_count"
    )

    total_unique_needed = total - shared_count * common_count
    half = total_unique_needed // 2
    extra = total_unique_needed % 2

    source_unique_count = half + extra
    lookalike_unique_count = half

    total_asids_needed = (
        shared_count + source_unique_count + lookalike_unique_count
    )

    all_asids = (
        session.query(EnrichmentAsid.asid)
        .order_by(func.random())
        .limit(total_asids_needed)
        .all()
    )
    all_asids = [r[0] for r in all_asids]

    shared_asids = all_asids[:shared_count]
    source_unique = all_asids[shared_count : shared_count + source_unique_count]
    lookalike_unique = all_asids[shared_count + source_unique_count :]

    source_rows = []
    lookalike_rows = []

    for sid in source_ids:
        for asid in shared_asids:
            source_rows.append((asid, sid, name))

    for lid in lookalike_ids:
        for asid in shared_asids:
            lookalike_rows.append((asid, lid, name))

    # Unique
    if source_ids:
        for i, asid in enumerate(source_unique):
            sid = source_ids[i % len(source_ids)]
            source_rows.append((asid, sid, name))

    if lookalike_ids:
        for i, asid in enumerate(lookalike_unique):
            lid = lookalike_ids[i % len(lookalike_ids)]
            lookalike_rows.append((asid, lid, name))


    insert_test_data(
        session, source_rows=source_rows, lookalike_rows=lookalike_rows
    )


def main():
    engine = create_engine(
        f"postgresql://{os.getenv('TEST_DB_USERNAME')}:{os.getenv('TEST_DB_PASSWORD')}@{os.getenv('TEST_DB_HOST')}:{os.getenv('TEST_DB_PORT')}/{os.getenv('TEST_DB_NAME')}"
    )
    Session = sessionmaker(bind=engine)
    session = Session()

    Base.metadata.create_all(engine)

    # populate_enrichment_asids(session, count=100)


if __name__ == "__main__":
    main()
