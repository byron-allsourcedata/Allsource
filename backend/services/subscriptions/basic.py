import logging

from db_dependencies import Db
from persistence.plans_persistence import PlansPersistence
from persistence.user_persistence import UserPersistence
from resolver import injectable
from services.stripe_service import StripeService
from services.subscriptions.exceptions import PlanNotFoundException
from services.user_subscriptions import UserSubscriptionsService
from config.stripe import StripeConfig

logger = logging.getLogger(__name__)


@injectable
class BasicPlanService:
    def __init__(
        self,
        db: Db,
        stripe: StripeService,
        plans: PlansPersistence,
        users: UserPersistence,
        user_subscriptions: UserSubscriptionsService,
        user_persistence: UserPersistence,
    ):
        self.db = db
        self.plans = plans
        self.stripe = stripe
        self.users = users
        self.user_subscriptions = user_subscriptions
        self.user_persistence = user_persistence

    def get_basic_plan_payment_url(self, customer_id: str) -> str:
        alias = "basic"
        basic_plan = self.plans.get_plan_by_alias(alias)

        if not basic_plan:
            raise PlanNotFoundException(alias)

        price_id = basic_plan.stripe_price_id

        session_url = self.stripe.create_checkout_session(
            customer_id=customer_id,
            payment_intent_data={
                "setup_future_usage": "off_session",
            },
            price_id=price_id,
            mode="payment",
            metadata={"type": "upgrade_basic"},
            success_url=StripeConfig.one_dollar_success_url,
        )

        return session_url

    def move_to_basic_plan(self, customer_id: str):
        user = self.users.by_customer_id(customer_id)
        if not user:
            logger.error(f"User not found with customer_id: {customer_id}")
            return
        user_id = user.id

        self.user_persistence.set_has_credit_card(user_id)
        self.user_subscriptions.move_to_plan(user_id, "basic")
        basic_records = self.plans.get_plan_by_alias("basic_records")
        if not basic_records:
            logger.error("Basic records not found!")
            return

        self.stripe.create_basic_plan_subscription(
            customer_id=customer_id,
            stripe_price_id=basic_records.stripe_price_id,
        )
