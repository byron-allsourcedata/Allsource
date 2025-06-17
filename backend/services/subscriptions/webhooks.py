from persistence.user_persistence import UserPersistence
from resolver import injectable
from services.subscriptions.basic import BasicPlanService


@injectable
class SubscriptionWebhookService:
    def __init__(
        self,
        user_persistence: UserPersistence,
        basic_plan_service: BasicPlanService,
    ):
        self.user_persistence = user_persistence
        self.basic_plan_service = basic_plan_service

    def move_to_basic_plan(self, customer_id: str):
        self.basic_plan_service.move_to_basic_plan(customer_id)
