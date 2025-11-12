from datetime import datetime, timezone
import logging
import time

from persistence.plans_persistence import PlansPersistence
from resolver import injectable
from services.stripe_service import StripeService
from services.subscriptions.exceptions import PlanNotFoundException
from config.stripe import StripeConfig
from persistence.user_persistence import UserPersistence
from services.user_subscriptions import UserSubscriptionsService

logger = logging.getLogger(__name__)


@injectable
class PixelPlanService:
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

    def get_pixel_plan_payment_url(self, customer_id: str) -> str:
        alias = "pixel"
        plan = self.plans.get_plan_by_alias(alias)

        if not plan:
            raise PlanNotFoundException(alias)

        price_id = plan.stripe_price_id

        # session_url = self.stripe.create_checkout_session(
        #     customer_id=customer_id,
        #     price_id=price_id,
        #     payment_intent_data={
        #         "setup_future_usage": "off_session",
        #     },
        #     mode="payment",
        #     metadata={"type": "upgrade_pixel_plan"},
        #     success_url=StripeConfig.success_url,
        # )

        session_url = self.stripe.create_checkout_session(
            customer_id=customer_id,
            price_id=price_id,
            mode="subscription",
            metadata={"type": "upgrade_pixel_plan"},
            success_url=StripeConfig.success_url,
        )

        return session_url

    def move_to_pixel_plan(self, customer_id: str, subscription_id: str):
        user = self.users.by_customer_id(customer_id)
        if not user:
            logger.error(f"User not found with customer_id: {customer_id}")
            return
        user_id = user.id

        trial_days = 14

        self.user_persistence.set_has_credit_card(user_id)
        self.user_subscriptions.move_to_plan(
            user_id=user_id,
            plan_alias="pixel",
            plan_end=datetime.fromtimestamp(
                int(time.time()) + int(trial_days) * 24 * 3600
            ),
        )
        standart_monthly_plan = self.plans.get_plan_by_alias("standard_monthly")

        # res = self.stripe.create_pixel_plan_subscription_with_one_time_charge(
        #     customer_id=customer_id,
        #     future_plan_price_id=standart_monthly_plan.stripe_price_id,
        #     trial_days=14,
        # )

        # if not res.get("success"):
        #     logger.error(
        #         f"Failed to create pixel flow for user {user_id}: {res.get('error')}"
        #     )
        #     return

        # subscription = res.get("subscription")
        # plan_end = res.get("plan_end")
        # logger.info(
        #     f"User {user_id} moved to pixel plan (trial until {plan_end}), subscription {subscription.get('id')}"
        # )

        res = self.stripe.create_shedule_payments(
            subscription_id=subscription_id,
            future_plan_price_id=standart_monthly_plan.stripe_price_id,
        )

        if not res.get("success"):
            logger.error(
                "Failed to create/modify schedule for subscription %s: %s",
                subscription_id,
                res.get("error"),
            )
        else:
            logger.info(
                "Schedule created/modified for subscription %s: %s",
                subscription_id,
                res.get("schedule_id"),
            )
