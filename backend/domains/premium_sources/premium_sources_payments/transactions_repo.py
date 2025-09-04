from uuid import UUID, uuid4

from sqlalchemy import select
from db_dependencies import Db
from models.premium_sources_transactions import PremiumSourceTransaction
from resolver import injectable
from utils.time import utcnow


@injectable
class PremiumSourceTransactionsRepo:
    def __init__(self, db: Db):
        self.db = db

    def create(self, user_id: int, premium_source_id: UUID):
        transaction_id = uuid4()
        creation_time = utcnow()

        transaction = PremiumSourceTransaction(
            id=transaction_id,
            premium_source_id=premium_source_id,
            user_id=user_id,
            created_at=creation_time,
            updated_at=creation_time,
        )
        self.db.add(transaction)
        self.db.flush()

        return transaction

    def by_premium_source_id(
        self, premium_source_id: UUID
    ) -> list[PremiumSourceTransaction]:
        transactions = self.db.execute(
            select(PremiumSourceTransaction).where(
                PremiumSourceTransaction.premium_source_id == premium_source_id
            )
        ).scalars()

        return list(transactions)
