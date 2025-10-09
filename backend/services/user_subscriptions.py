from datetime import datetime
import logging

from db_dependencies import Db
from persistence.plans_persistence import PlansPersistence
from persistence.user_subscriptions import UserSubscriptionsPersistence
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class UserSubscriptionsService:
    def __init__(
        self,
        db: Db,
        plans: PlansPersistence,
        user_subscriptions: UserSubscriptionsPersistence,
    ):
        self.user_subscriptions = user_subscriptions
        self.plans = plans
        self.db = db

    def move_to_plan(self, user_id: int, plan_alias: str) -> bool:
        """Return False -> Failed(plan is not defined)
        Return True -> Success
        """
        plan = self.plans.get_plan_by_alias(plan_alias)
        if not plan:
            logger.warning(f"{plan_alias} not found!")
            return False
        user_subscription = self.user_subscriptions.add(
            user_id=user_id, plan=plan
        )
        self.db.flush()
        self.user_subscriptions.set_current_subscription(
            user_id=user_id, subscription_id=user_subscription.id, plan=plan
        )
        self.db.flush()
        return True

    def add_subscription_with_dates(
        self,
        user_id: int,
        plan_alias: str,
        plan_start: datetime,
        plan_end: datetime,
    ):
        """
        Creates a subscription record with plan_start/plan_end based on data from Stripe,
        """
        plan = self.plans.get_plan_by_alias(plan_alias)
        if not plan:
            logger.error(f"Plan '{plan_alias}' not found")
            return None

        user_subscription = self.user_subscriptions.add_subscription_with_dates(
            user_id=user_id,
            plan=plan,
            plan_start=plan_start,
            plan_end=plan_end,
        )

        self.user_subscriptions.set_current_subscription(
            user_id=user_id, subscription_id=user_subscription.id, plan=plan
        )

        self.db.flush()

        logger.info(
            f"Added subscription {user_subscription.id} for user {user_id} "
            f"plan={plan_alias} start={plan_start} end={plan_end}"
        )

        return user_subscription
