import asyncio
import json
import logging
import os
import sys

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
parent_parent_dir = os.path.abspath(os.path.join(parent_dir, os.pardir))
sys.path.append(parent_parent_dir)

from resolver import Resolver
from schemas.audience import NewSource, RegeneretedAudienceSmart
from services.sources.service import AudienceSourceService
from services.audience_smarts import AudienceSmartsService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SOURCE_ID = "54d918e8-a955-41de-8d5b-767906d16ecf"
SMART_ID = "32fb4af8-6d70-4817-9190-27b95d07b137"


def clean_validations(validations: dict) -> dict:
    keys_to_remove = {
        "count_submited",
        "processed",
        "count_validated",
        "count_cost",
    }

    for field, checks in validations.items():
        for check in checks:
            for _, check_data in check.items():
                for key in list(check_data.keys()):
                    if key in keys_to_remove:
                        del check_data[key]
    return validations


async def main():
    resolver = Resolver()

    source_service = await resolver.resolve(AudienceSourceService)
    smart_service = await resolver.resolve(AudienceSmartsService)

    source = source_service.get_source_for_regenerate(SOURCE_ID)

    source_params = {
        "target_schema": source.target_schema,
        "source_type": source.source_type,
        "source_origin": source.source_origin,
        "source_name": source.name,
        "file_url": source.file_url,
        "rows": json.loads(source.rows),
    }

    new_source = await source_service.create_source(
        user_id=source.user_id,
        user_full_name=source.full_name,
        payload=NewSource(**source_params),
    )

    while True:
        source_matching_info = source_service.get_matching_info(new_source.id)
        logging.info(f"smart_matching_info {source_matching_info}")
        if source_matching_info.matched_records_status == "complete":
            logging.info("end1")
            break
        await asyncio.sleep(5)

    smart_audience = RegeneretedAudienceSmart(
        **smart_service.get_smart_for_regenerate(SMART_ID)
    )

    cleaned_validations = clean_validations(smart_audience.validations)

    new_smart_audience = await smart_service.create_audience_smart(
        name=smart_audience.name,
        user_full_name=smart_audience.full_name,
        user_id=smart_audience.user_id,
        created_by_user_id=smart_audience.created_by_user_id,
        use_case_alias=smart_audience.use_case_alias,
        data_sources=smart_audience.data_sources,
        validation_params=cleaned_validations,
        active_segment_records=smart_audience.active_segment_records,
        total_records=smart_audience.total_records,
        target_schema=smart_audience.target_schema,
        contacts_to_validate=smart_audience.active_segment_records,
    )

    while True:
        smart_matching_info = smart_service.get_matching_info(
            new_smart_audience.id
        )
        logging.info(f"smart_matching_info {smart_matching_info}")
        if smart_matching_info.status == "ready":
            logging.info("end2")
            break
        await asyncio.sleep(5)

    difference = {
        "source_matched_persons": {
            "was": source.matched_records,
            "now": source_matching_info.matched_records,
        },
        "smart_validated_records": {
            "was": smart_audience.validated_records,
            "now": smart_matching_info.validated_records,
        },
    }

    with open("difference.json", "w") as json_file:
        json.dump(difference, json_file, indent=4)

    logging.info("JSON file with differences created successfully.")


if __name__ == "__main__":
    asyncio.run(main())
