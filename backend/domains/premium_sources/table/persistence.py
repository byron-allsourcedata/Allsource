import logging
from uuid import UUID, uuid4
import uuid

from sqlalchemy import select
from domains.premium_sources.schemas import (
    BasePremiumSourceDto,
    PremiumSourceDto,
)
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
        self,
        name: str,
        price: int,
        user_id: int,
        s3_url: str,
        rows: int,
        source_id: UUID | None = None,
    ) -> PremiumSource:
        if source_id is not None:
            id = source_id
        else:
            id = uuid.uuid4()
        new_source = PremiumSource(
            id=id,
            name=name,
            price=price,
            user_id=user_id,
            s3_url=s3_url,
            rows=rows,
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

    def list(self, user_id: int) -> list[BasePremiumSourceDto]:
        raw_list = list(
            self.db.execute(
                select(PremiumSource)
                .where(PremiumSource.user_id == user_id)
                .order_by(PremiumSource.created_at.desc())
            )
            .scalars()
            .all()
        )

        result: list[BasePremiumSourceDto] = []
        for row in raw_list:
            result.append(
                BasePremiumSourceDto(
                    id=row.id,
                    name=row.name,
                    price=row.price,
                    user_id=row.user_id,
                    rows=row.rows,
                    created_at=row.created_at,
                )
            )
        return result
