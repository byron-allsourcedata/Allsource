from persistence.user_persistence import UserPersistence
from resolver import injectable
from services.subscriptions.basic import BasicPlanService


@injectable
class SubscriptionWebhookService:
    def __init__(self, users: UserPersistence, basic_plan: BasicPlanService):
        self.users = users
        self.basic_plan = basic_plan

    def move_to_basic_plan(self, customer_id: str):
        self.basic_plan.move_to_basic_plan(customer_id)
