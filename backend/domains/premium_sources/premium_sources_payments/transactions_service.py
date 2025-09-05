from uuid import UUID
from domains.premium_sources.premium_sources_payments.exceptions import (
    MultiplePremiumSourceTransactionsError,
)
from domains.premium_sources.premium_sources_payments.transactions_repo import (
    PremiumSourceTransactionsRepo,
)
from resolver import injectable


@injectable
class PremiumSourceTransactionsService:
    def __init__(self, repo: PremiumSourceTransactionsRepo) -> None:
        self.repo = repo

    def id_by_premium_source_id(self, transaction_id: UUID) -> UUID | None:
        """
        Raises `MultiplePremiumSourceTransactionsError`
        """
        transactions = self.repo.by_premium_source_id(transaction_id)

        if len(transactions) > 1:
            raise MultiplePremiumSourceTransactionsError()

        if len(transactions) == 0:
            return None

        return transactions[0].id

    def create(self, user_id: int, premium_source_id: UUID) -> UUID:
        transaction = self.repo.create(
            user_id=user_id,
            premium_source_id=premium_source_id,
        )

        return transaction.id
