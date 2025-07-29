import pytest
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import declarative_base
import os, sys

pytestmark = pytest.mark.asyncio

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
parent_parent_dir = os.path.abspath(os.path.join(parent_dir, os.pardir))
sys.path.append(parent_parent_dir)

from services.audience_smarts import AudienceSmartsService

Base = declarative_base()


class AudienceLookalikesPerson(Base):
    __tablename__ = "audience_lookalikes_persons"
    enrichment_user_asid = Column(PG_UUID(as_uuid=True), primary_key=True)
    lookalike_id = Column(PG_UUID(as_uuid=True), nullable=False)


class AudienceSourcesMatchedPerson(Base):
    __tablename__ = "audience_sources_matched_persons"
    enrichment_user_asid = Column(PG_UUID(as_uuid=True), primary_key=True)
    source_id = Column(PG_UUID(as_uuid=True), nullable=False)


@pytest.fixture
def test_ids():
    return {
        "lookalike_id_1": "8e734352-87ee-487f-8ea8-34c2285ec36d",
        "lookalike_id_2": "8d0f63c0-0526-4fd2-ac8b-410667c48575",
        "source_id_1": "2b9d2123-7c2b-4a21-8a08-db69b7148399",
        "source_id_2": "b011f288-7edb-484a-86cb-d1f9b9ce7a7b",
        # UNIQUE
        "lookalike_id_3": "dfe4d100-ced7-4589-ad3a-c84637f21192",
        "lookalike_id_4": "07c5d128-0eb3-4061-821c-a927a6c44607",
        "source_id_3": "21d29cf1-ae20-42ae-a851-c17bb80c7097",
        "source_id_4": "211b73bd-8cd1-4992-b097-89273f2465ce",
    }


def get_asid_list(query):
    return [str(row[0]) for row in query]


@pytest.mark.asyncio
async def test_include_include_exclude_exclude(
    test_ids, service: AudienceSmartsService
):
    kwargs = {
        "lookalike_include": [test_ids["lookalike_id_3"]],
        "lookalike_exclude": [test_ids["lookalike_id_4"]],
        "source_include": [test_ids["source_id_3"]],
        "source_exclude": [test_ids["source_id_4"]],
    }

    query = service.get_include_exclude_query(**kwargs)
    result = get_asid_list(query)

    query = service._get_test_include_exclude_query(**kwargs)
    expected_result = list(query)

    assert (
        {str(x) for x in result} == {str(x) for x in expected_result} != set()
    )


@pytest.mark.asyncio
async def test_include_exclude_logic(test_ids, service: AudienceSmartsService):
    kwargs = {
        "lookalike_include": [],
        "lookalike_exclude": [],
        "source_include": [test_ids["source_id_1"]],
        "source_exclude": [test_ids["source_id_2"]],
    }

    query = service.get_include_exclude_query(**kwargs)
    result = get_asid_list(query)

    query = service._get_test_include_exclude_query(**kwargs)
    expected_result = list(query)

    assert (
        {str(x) for x in result} == {str(x) for x in expected_result} != set()
    )


@pytest.mark.asyncio
async def test_include_include_logic(test_ids, service: AudienceSmartsService):
    kwargs = {
        "lookalike_include": [],
        "lookalike_exclude": [],
        "source_include": [test_ids["source_id_1"], test_ids["source_id_2"]],
        "source_exclude": [],
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
    test_ids, service: AudienceSmartsService
):
    kwargs = {
        "lookalike_include": [],
        "lookalike_exclude": [],
        "source_include": [test_ids["source_id_3"]],
        "source_exclude": [test_ids["source_id_1"], test_ids["source_id_2"]],
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
