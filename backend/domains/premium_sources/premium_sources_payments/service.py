import logging
from uuid import UUID
from db_dependencies import Db
from domains.premium_sources.premium_sources_payments.exceptions import (
    InsufficientFunds,
    PriceHasChangedError,
)
from domains.premium_sources.premium_sources_payments.funds_deductions_repo import (
    FundsDeductionsPersistence,
)
from domains.premium_sources.premium_sources_payments.stripe_deductions_repo import (
    StripeDeductionsPersistence,
)
from domains.premium_sources.premium_sources_payments.stripe_service import (
    PremiumSourceStripeService,
)
from domains.premium_sources.premium_sources_payments.transactions_service import (
    PremiumSourceTransactionsService,
)
from domains.premium_sources.table.service import PremiumSourceTableService
from domains.users.users_funds.service import UserFundsService
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class PremiumSourcesPaymentsService:
    def __init__(
        self,
        db: Db,
        sources: PremiumSourceTableService,
        funds_deductions: FundsDeductionsPersistence,
        transactions: PremiumSourceTransactionsService,
        user_funds: UserFundsService,
        stripe: PremiumSourceStripeService,
        stripe_deductions: StripeDeductionsPersistence,
    ) -> None:
        self.db = db
        self.sources = sources
        self.transactions = transactions
        self.funds_deductions = funds_deductions
        self.stripe_deductions = stripe_deductions
        self.users_funds = user_funds
        self.stripe = stripe

    def charge_for_premium_source(
        self,
        user_id: int,
        premium_source_id: UUID,
        payment_method_id: str | None,
        amount: int,
    ):
        """
        Raises `UserNotFound` \n
        Raises `PremiumSourceNotFound` \n
        Raises `DeductionNotFound` \n
        Raises `MultipleTransactionsError` \n
        Raises `InsuffientFunds` \n
        Raises `MultipleUsersUpdated` \n
        Raises `PriceHasChangedError`
        """
        user_premium_source_funds = self.users_funds.premium_funds(user_id)
        self.sources.assert_owned_by_user(user_id, premium_source_id)
        premium_source_cost = self.sources.get_cost(premium_source_id)

        paid_amount = self.paid_amount_by_premium_source_id(premium_source_id)

        if paid_amount >= premium_source_cost:
            logger.info("user had already paid for source")
            return

        unpaid_amount = premium_source_cost - paid_amount

        if unpaid_amount != amount:
            raise PriceHasChangedError()

        if (
            user_premium_source_funds is None
            or user_premium_source_funds >= unpaid_amount
        ):
            self.create_funds_transaction(
                user_id,
                premium_source_id,
                funds_snapshot=user_premium_source_funds,
                transaction_amount_cents=unpaid_amount,
            )
            return

        if payment_method_id is not None:
            # use all leftover funds for premium source

            amount_to_pay = unpaid_amount - user_premium_source_funds

            self.create_funds_stripe_transaction(
                user_id,
                premium_source_id,
                payment_method_id=payment_method_id,
                funds_used_amount=user_premium_source_funds,
                funds_snapshot=user_premium_source_funds,
                stripe_paid_amount=amount_to_pay,
            )

            self.stripe.charge_customer_immediately(
                user_id=user_id,
                payment_method_id=payment_method_id,
                amount=amount_to_pay,
                premium_source_id=premium_source_id,
            )

            return

        raise InsufficientFunds()

    def commit(self):
        self.db.commit()

    def create_funds_transaction(
        self,
        user_id: int,
        premium_source_id: UUID,
        funds_snapshot: int | None,
        transaction_amount_cents: int,
    ):
        """
        Raises `InsuffientFunds` \n
        Raises `UserNotFound` \n
        Raises `MultipleUsersUpdated`
        """
        transaction_id = self.transactions.create(
            user_id=user_id,
            premium_source_id=premium_source_id,
        )

        _deduction = self.funds_deductions.create(
            transaction_id=transaction_id,
            amount=transaction_amount_cents,
            funds_snapshot=funds_snapshot,
        )

        self.users_funds.deduct_premium_funds(user_id, transaction_amount_cents)

    def create_funds_stripe_transaction(
        self,
        user_id: int,
        premium_source_id: UUID,
        funds_snapshot: int | None,
        payment_method_id: str,
        funds_used_amount: int,
        stripe_paid_amount: int,
    ):
        """
        Raises `InsuffientFunds` \n
        Raises `UserNotFound` \n
        Raises `MultipleUsersUpdated`
        """
        transaction_id = self.transactions.create(
            user_id=user_id,
            premium_source_id=premium_source_id,
        )

        if funds_used_amount > 0:
            _deduction = self.funds_deductions.create(
                transaction_id=transaction_id,
                amount=funds_used_amount,
                funds_snapshot=funds_snapshot,
            )

        if stripe_paid_amount > 0:
            _deduction = self.stripe_deductions.create(
                transaction_id=transaction_id,
                amount=stripe_paid_amount,
                funds_snapshot=funds_snapshot,
                payment_method_id=payment_method_id,
            )

        self.users_funds.deduct_premium_funds(user_id, funds_used_amount)

    def paid_amount_by_premium_source_id(self, premium_source_id: UUID):
        """
        Raises `MultipleTransactionsError` \n
        Raises `DeductionNotFound`
        """
        transaction = self.transactions.id_by_premium_source_id(
            premium_source_id
        )

        if transaction is None:
            return 0

        funds_payments = self.funds_deductions.ids_by_transaction_id(
            transaction
        )

        stripe_payments = self.stripe_deductions.ids_by_transaction_id(
            transaction
        )

        amount = 0

        for funds_payment in funds_payments:
            payment_amount = self.funds_deductions.amount_by_id(
                funds_payment.id
            )
            amount += payment_amount

        for stripe_payment in stripe_payments:
            payment_amount = self.stripe_deductions.amount_by_id(
                stripe_payment.id
            )
            amount += payment_amount

        return amount

    def is_premium_source_paid(self, premium_source_id: UUID):
        """
        Raises `DeductionNotFound`

        Raises `MultiplePremiumSourceTransactionsError` \n
        """
        source_cost = self.sources.get_cost(premium_source_id)
        amount_paid = self.paid_amount_by_premium_source_id(premium_source_id)

        if amount_paid >= source_cost:
            return True

        return False
