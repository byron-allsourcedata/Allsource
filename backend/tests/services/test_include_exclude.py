import uuid
import pytest
from sqlalchemy import Column, VARCHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import declarative_base
import os, sys

pytestmark = pytest.mark.asyncio

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
parent_parent_dir = os.path.abspath(os.path.join(parent_dir, os.pardir))
sys.path.append(parent_parent_dir)

from bin.tests.generate_fake_persons import (
    create_multiple_sources_and_lookalikes_with_overlap,
)
from services.audience_smarts import AudienceSmartsService

Base = declarative_base()


class AudienceLookalikesPerson(Base):
    __tablename__ = "audience_lookalikes_persons"
    enrichment_user_asid = Column(PG_UUID(as_uuid=True), primary_key=True)
    lookalike_id = Column(PG_UUID(as_uuid=True), nullable=False)
    name = Column(VARCHAR(128), nullable=True)


class AudienceSourcesMatchedPerson(Base):
    __tablename__ = "audience_sources_matched_persons"
    enrichment_user_asid = Column(PG_UUID(as_uuid=True), primary_key=True)
    source_id = Column(PG_UUID(as_uuid=True), nullable=False)
    name = Column(VARCHAR(128), nullable=True)


@pytest.fixture
def enrichment_test_data(db_session):
    def _create(
        name,
        source_ids,
        lookalike_ids,
        total,
        shared_count,
    ):
        source_ids = source_ids or []
        lookalike_ids = lookalike_ids or []

        create_multiple_sources_and_lookalikes_with_overlap(
            session=db_session,
            source_ids=source_ids,
            lookalike_ids=lookalike_ids,
            total=total,
            shared_count=shared_count,
            name=name,
        )

        return {
            "source_ids": source_ids,
            "lookalike_ids": lookalike_ids,
        }

    return _create


def get_asid_list(query):
    return [str(row[0]) for row in query]


@pytest.mark.asyncio
async def test_include_include_exclude_exclude(
    enrichment_test_data, service: AudienceSmartsService
):
    ids = enrichment_test_data(
        name="include_include_exclude_exclude_unique",
        total=12,
        shared_count=0,
        lookalike_ids=[uuid.uuid4(), uuid.uuid4()],
        source_ids=[uuid.uuid4(), uuid.uuid4()],
    )

    kwargs = {
        "lookalike_include": [str(ids["lookalike_ids"][0])],
        "lookalike_exclude": [str(ids["lookalike_ids"][1])],
        "source_include": [str(ids["source_ids"][0])],
        "source_exclude": [str(ids["source_ids"][1])],
    }

    query = service.get_include_exclude_query(**kwargs)
    result = get_asid_list(query)

    query = service._get_test_include_exclude_query(**kwargs)
    expected_result = list(query)

    assert (
        {str(x) for x in result} == {str(x) for x in expected_result} != set()
    )


@pytest.mark.asyncio
async def test_include_exclude_logic(
    enrichment_test_data, service: AudienceSmartsService
):
    ids = enrichment_test_data(
        name="include_exclude_overlap",
        total=12,
        shared_count=4,
        lookalike_ids=[],
        source_ids=[uuid.uuid4(), uuid.uuid4()],
    )

    kwargs = {
        "lookalike_include": [],
        "lookalike_exclude": [],
        "source_include": [str(ids["source_ids"][0])],
        "source_exclude": [str(ids["source_ids"][1])],
    }

    query = service.get_include_exclude_query(**kwargs)
    result = get_asid_list(query)

    query = service._get_test_include_exclude_query(**kwargs)
    expected_result = list(query)

    assert (
        {str(x) for x in result} == {str(x) for x in expected_result} != set()
    )


@pytest.mark.asyncio
async def test_include_include_logic(
    enrichment_test_data, service: AudienceSmartsService
):
    ids = enrichment_test_data(
        name="include_include_overlap",
        total=12,
        shared_count=4,
        lookalike_ids=[],
        source_ids=[uuid.uuid4(), uuid.uuid4()],
    )

    kwargs = {
        "lookalike_include": [],
        "lookalike_exclude": [],
        "source_include": [
            str(ids["source_ids"][0]),
            str(ids["source_ids"][1]),
        ],
    }

    query = service.get_include_exclude_query(**kwargs)
    result = get_asid_list(query)

    query = service._get_test_include_exclude_query(**kwargs)
    expected_result = list(query)

    assert (
        {str(x) for x in result} == {str(x) for x in expected_result} != set()
    )


@pytest.mark.asyncio
async def test_include_exclude_exclude_logic(
    enrichment_test_data, service: AudienceSmartsService
):
    ids_1 = enrichment_test_data(
        name="exclude_exclude_overlap",
        total=12,
        shared_count=4,
        lookalike_ids=[],
        source_ids=[uuid.uuid4(), uuid.uuid4()],
    )
    ids_2 = enrichment_test_data(
        name="include_unique",
        total=4,
        shared_count=0,
        lookalike_ids=[],
        source_ids=[uuid.uuid4()],
    )

    kwargs = {
        "lookalike_include": [],
        "lookalike_exclude": [],
        "source_include": [str(ids_2["source_ids"][0])],
        "source_exclude": [
            str(ids_1["source_ids"][0]),
            str(ids_1["source_ids"][1]),
        ],
    }

    query = service.get_include_exclude_query(**kwargs)
    result = get_asid_list(query)

    query = service._get_test_include_exclude_query(**kwargs)
    expected_result = list(query)

    assert (
        {str(x) for x in result} == {str(x) for x in expected_result} != set()
    )


@pytest.mark.asyncio
async def test_error_on_empty_includes(service: AudienceSmartsService):
    with pytest.raises(
        RuntimeError, match="Includes in smart audience are empty"
    ):
        service.get_include_exclude_query(
            lookalike_include=[],
            source_include=[],
            lookalike_exclude=[],
            source_exclude=[],
        )
