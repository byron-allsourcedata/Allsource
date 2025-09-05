from uuid import UUID, uuid4

from sqlalchemy import select

from db_dependencies import Db
from domains.premium_sources.premium_sources_payments.exceptions import (
    DeductionNotFound,
)
from models.premium_sources_stripe_deductions import (
    PremiumSourceStripeDeduction,
)
from resolver import injectable
from utils.time import utcnow


@injectable
class StripeDeductionsPersistence:
    def __init__(self, db: Db) -> None:
        self.db = db

    def ids_by_transaction_id(self, transaction_id: UUID):
        deductions = self.db.execute(
            select(PremiumSourceStripeDeduction).where(
                PremiumSourceStripeDeduction.transaction_id == transaction_id
            )
        ).scalars()

        return list(deductions)

    def amount_by_id(self, deduction_id: UUID):
        """
        Raises DeductionNotFound
        """
        deduction = self.db.execute(
            select(PremiumSourceStripeDeduction).where(
                PremiumSourceStripeDeduction.id == deduction_id
            )
        ).scalar()

        if not deduction:
            raise DeductionNotFound()

        return deduction.amount

    def create(
        self,
        amount: int,
        transaction_id: UUID,
        funds_snapshot: int | None,
        payment_method_id: str,
    ):
        fund_deduction_id = uuid4()
        now = utcnow()
        deduction = PremiumSourceStripeDeduction(
            id=fund_deduction_id,
            transaction_id=transaction_id,
            payment_method_id=payment_method_id,
            amount=amount,
            funds_snapshot=funds_snapshot,
            created_at=now,
            updated_at=now,
        )

        self.db.add(deduction)

        return deduction
