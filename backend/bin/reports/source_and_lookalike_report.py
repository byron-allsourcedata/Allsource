import asyncio

from resolver import Resolver
from services.lookalikes import AudienceLookalikesService
from services.audience_sources import AudienceSourceService


async def main():
    resolver = Resolver()

    audience_lookalikes_service = await resolver.resolve(
        AudienceLookalikesService
    )
    audience_source_service = await resolver.resolve(AudienceSourceService)

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


if __name__ == "__main__":
    asyncio.run(main())
