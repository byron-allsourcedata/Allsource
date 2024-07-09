import logging

from models.send_grid_template import SendGridTemplate
from .subscriptions import SubscriptionService
from .user_persistence_service import UserPersistenceService
from models.plans import SubscriptionPlan, UserSubscriptionPlan
from sqlalchemy.orm import Session

TRIAL_STUB_PLAN_ID = 17
WITHOUT_CARD_PLAN_ID = 15

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class SendGridPersistenceService:
    def __init__(self, db: Session):
        self.db = db

    def get_template_by_alias(self, alias):
        template = self.db.query(SendGridTemplate).filter(SendGridTemplate.alias == alias).first()
        if template:
            return template.template_id