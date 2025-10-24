import asyncio
from domains.liveramp.service import LiverampService
from domains.liveramp.persistence.postgresql import PostgresPersistence
from domains.liveramp.persistence.clickhouse import ClickHousePersistence
from db_dependencies import Db, Clickhouse
from persistence.enrichment_users import EnrichmentUsersPersistence
from resolver import Resolver
import logging


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s.%(msecs)03d %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


async def main():
    resolver = Resolver()
    db_session = await resolver.resolve(Db)
    ch_client = await resolver.resolve(Clickhouse)

    postgres_persistence = PostgresPersistence(db=db_session)
    enrichment_users_persistence = EnrichmentUsersPersistence(
        clickhouse=ch_client
    )
    clickhouse_persistence = ClickHousePersistence(
        enrichment_users=enrichment_users_persistence, clickhouse=ch_client
    )

    service = LiverampService(
        postgres_persistence=postgres_persistence,
        clickhouse_persistence=clickhouse_persistence,
    )

    csv_content, statistics = service.generate_enriched_leads_report()

    print(f"Processing statistics: {statistics}")

    service.save_csv_to_file(csv_content, "enriched_leads_report.csv")


if __name__ == "__main__":
    asyncio.run(main())
