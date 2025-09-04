from uuid import UUID, uuid4

from sqlalchemy import select

from db_dependencies import Db
from domains.premium_sources.premium_sources_payments.exceptions import (
    DeductionNotFound,
)
from models.premium_sources_funds_deduction import PremiumSourceFundsDeduction
from resolver import injectable
from utils.time import utcnow


@injectable
class FundsDeductionsPersistence:
    def __init__(self, db: Db) -> None:
        self.db = db

    def ids_by_transaction_id(self, transaction_id: UUID):
        deductions = self.db.execute(
            select(PremiumSourceFundsDeduction).where(
                PremiumSourceFundsDeduction.transaction_id == transaction_id
            )
        ).scalars()

        return list(deductions)

    def amount_by_id(self, deduction_id: UUID):
        """
        Raises DeductionNotFound
        """
        deduction = self.db.execute(
            select(PremiumSourceFundsDeduction).where(
                PremiumSourceFundsDeduction.id == deduction_id
            )
        ).scalar()

        if not deduction:
            raise DeductionNotFound()

        return deduction.amount

    def create(
        self, amount: int, transaction_id: UUID, funds_snapshot: int | None
    ):
        fund_deduction_id = uuid4()
        now = utcnow()
        deduction = PremiumSourceFundsDeduction(
            id=fund_deduction_id,
            transaction_id=transaction_id,
            amount=amount,
            funds_snapshot=funds_snapshot,
            created_at=now,
            updated_at=now,
        )

        self.db.add(deduction)

        return deduction
