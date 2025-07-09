import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from db_dependencies import Db
from resolver import Resolver
from services.insightsUtils import InsightsUtils
from models.audience_sources import AudienceSource
from sqlalchemy import update
from services.source_agent.agent import SourceAgentService


async def main():
    source_id = "55151cd5-dc5e-4bc1-be23-411ab63c0b93"
    resolver = Resolver()
    db = await resolver.resolve(Db)
    source_agent = await resolver.resolve(SourceAgentService)

    db.execute(
        update(AudienceSource)
        .where(AudienceSource.id == source_id)
        .values(insights=None)
    )
    db.commit()

    insights = InsightsUtils.process_insights(
        source_id=source_id, db_session=db, source_agent=source_agent
    )

    db.commit()


if __name__ == "__main__":
    asyncio.run(main())
