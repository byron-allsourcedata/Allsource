from datetime import datetime
from typing import Literal
import logging

from persistence.plans_persistence import PlansPersistence
from resolver import injectable
from services.stripe_service import StripeService
from services.subscriptions.exceptions import PlanNotFoundException
from config.stripe import StripeConfig
from persistence.user_persistence import UserPersistence
from services.user_subscriptions import UserSubscriptionsService

logger = logging.getLogger(__name__)


@injectable
class StandardPlanService:
    def __init__(
        self,
        stripe: StripeService,
        plans: PlansPersistence,
        users: UserPersistence,
        user_subscriptions: UserSubscriptionsService,
        user_persistence: UserPersistence,
    ):
        self.plans = plans
        self.stripe = stripe
        self.users = users
        self.user_subscriptions = user_subscriptions
        self.user_persistence = user_persistence

    def get_standard_plan_payment_url(
        self, customer_id: str, interval: Literal["month", "year"]
    ) -> str:
        if interval == "month":
            alias = "standard_monthly"
        else:
            alias = "standard_yearly"

        plan = self.plans.get_plan_by_alias(alias)

        if not plan:
            raise PlanNotFoundException(alias)

        price_id = plan.stripe_price_id

        session_url = self.stripe.create_checkout_session(
            customer_id=customer_id,
            price_id=price_id,
            mode="subscription",
            metadata={"type": "upgrade_standard", "plan_period": interval},
            success_url=StripeConfig.success_url,
        )

        return session_url

    def move_to_standard_plan(
        self, customer_id: str, subscription_id: str, plan_period: str
    ):
        user = self.users.by_customer_id(customer_id)
        if not user:
            logger.error(f"User not found with customer_id: {customer_id}")
            return
        user_id = user.id
        self.user_persistence.set_has_credit_card(user_id)

        stripe_info = self.stripe.get_subscription_info(subscription_id)
        if stripe_info["status"] != "SUCCESS":
            logger.error(
                "Failed to retrieve subscription info from Stripe: "
                + stripe_info.get("message", "")
            )
            return

        data = stripe_info["data"]
        plan_start = data["plan_start"]
        plan_end = data["plan_end"]
        if plan_period == "month":
            plan_alias = "standard_monthly"
        elif plan_period == "year":
            plan_alias = "standard_yearly"
        else:
            logger.error(
                f"Unknown plan_period '{plan_period}', fallback to 'standard_monthly'"
            )
            plan_alias = "standard_monthly"

        self.user_subscriptions.add_subscription_with_dates(
            user_id=user_id,
            plan_alias=plan_alias,
            plan_start=plan_start,
            plan_end=plan_end,
        )

        logger.info(f"User {user_id} moved to standard plan (until {plan_end})")
