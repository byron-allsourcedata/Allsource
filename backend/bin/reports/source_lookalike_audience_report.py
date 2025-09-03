import asyncio
import argparse
from resolver import Resolver
from services.lookalikes import AudienceLookalikesService
from services.audience_sources import AudienceSourceService
from services.audience_smarts import AudienceSmartsService


async def main(min_records: int):
    print(f"Start report. Min count active_segment_records = {min_records}")
    resolver = Resolver()

    audience_lookalikes_service = await resolver.resolve(
        AudienceLookalikesService
    )
    audience_source_service = await resolver.resolve(AudienceSourceService)
    audience_smart_service = await resolver.resolve(AudienceSmartsService)

    problem_lookalikes = (
        audience_lookalikes_service.get_problematic_lookalikes()
    )
    print("\n--- PROBLEMATIC LOOKALIKES ---")
    for l in problem_lookalikes:
        print(l)

    problem_sources = audience_source_service.get_problematic_sources()
    print("\n--- PROBLEMATIC SOURCES ---")
    for s in problem_sources:
        print(s)

    problem_smart = audience_smart_service.get_problematic_smart_audiences(
        min_records
    )
    print("\n--- PROBLEMATIC SMART AUDIENCES ---")
    for sm in problem_smart:
        print(sm)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Report problematic audiences")
    parser.add_argument(
        "--min-records",
        type=int,
        default=100,
        help="Min count active_segment_records for Smart Audiences",
    )
    args = parser.parse_args()

    asyncio.run(main(args.min_records))
