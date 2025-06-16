from db_dependencies import Db
from persistence.plans_persistence import PlansPersistence
from persistence.user_subscriptions import UserSubscriptionsPersistence
from resolver import injectable


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

    def move_to_plan(self, user_id: int, plan_alias: str):
        plan = self.plans.get_plan_by_alias(plan_alias)
        user_subscription = self.user_subscriptions.add(user_id=user_id, plan=plan)
        self.db.flush()
        self.user_subscriptions.set_current_subscription(
            user_id, user_subscription.id
        )
        self.db.flush()
