import logging

from db_dependencies import Db
from persistence.user_persistence import UserPersistence
from resolver import injectable
from .subscriptions import SubscriptionService

logger = logging.getLogger(__name__)
WITHOUT_CARD_PLAN_ID = 15


@injectable
class PaymentsPlans:
    def __init__(
        self,
        db: Db,
        subscription_service: SubscriptionService,
        user_persistence_service: UserPersistence,
    ):
        self.db = db
        self.subscription_service = subscription_service
        self.user_persistence_service = user_persistence_service
