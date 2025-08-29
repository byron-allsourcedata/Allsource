import logging
from uuid import UUID
import uuid

from sqlalchemy import select
from domains.premium_sources.schemas import PremiumSourceDto
from domains.premium_sources.sync.persistence import (
    PremiumSourceSyncPersistence,
)
from domains.premium_sources.sync_log.persistence import (
    PremiumSourceSyncLogPersistence,
)
from models.premium_source import PremiumSource
from resolver import injectable
from db_dependencies import Db

logger = logging.getLogger(__name__)


@injectable
class PremiumSourcePersistence:
    def __init__(
        self,
        db: Db,
        syncs: PremiumSourceSyncPersistence,
        sync_logs: PremiumSourceSyncLogPersistence,
    ):
        self.db = db
        self.syncs = syncs
        self.sync_logs = sync_logs

    def create(
        self, name: str, user_id: int, s3_url: str, rows: int
    ) -> PremiumSource:
        id = uuid.uuid4()
        new_source = PremiumSource(
            id=id, name=name, user_id=user_id, s3_url=s3_url, rows=rows
        )
        self.db.add(new_source)
        self.db.flush()
        return new_source

    def get(self, source_id: UUID) -> PremiumSource | None:
        return self.db.query(PremiumSource).filter_by(id=source_id).first()

    def rename(self, source_id: UUID, new_name: str) -> PremiumSource:
        source = self.get(source_id)
        if source:
            source.name = new_name
            self.db.flush()
        return source

    def delete(self, source_id: UUID) -> bool:
        """
        Flushes
        """
        source = self.get(source_id)
        if source:
            self.db.delete(source)
            self.db.flush()
            return True
        return False

    def list(self, user_id: int) -> list[PremiumSourceDto]:
        raw_list = list(
            self.db.execute(
                select(PremiumSource)
                .where(PremiumSource.user_id == user_id)
                .order_by(PremiumSource.created_at.desc())
            )
            .scalars()
            .all()
        )

        result = []
        for row in raw_list:
            result_syncs = self.syncs.by_source_id(row.id)

            logger.debug(f"result_syncs: {len(result_syncs)}")

            if not result_syncs:
                status = "ready"
            else:
                synced_count = self.sync_logs.count(
                    result_syncs[0].id, "synced"
                )

                if synced_count == row.rows:
                    status = "synced"
                else:
                    status = "syncing"

            result.append(
                PremiumSourceDto(
                    id=row.id,
                    name=row.name,
                    user_id=row.user_id,
                    s3_url=row.s3_url,
                    status=status,
                    rows=row.rows,
                    created_at=row.created_at,
                )
            )
        return result
