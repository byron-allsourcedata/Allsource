
from datetime import datetime, timezone

from sqlalchemy import select

from db_dependencies import Db
from models import UserSubscriptions, Users, SubscriptionPlan, LeadUser
from resolver import injectable
from utils import end_of_month



@injectable
class UserSubscriptionsPersistence:
    def __init__(self, db: Db):
        self.db = db

    def add(self, user_id: int, plan: SubscriptionPlan):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        user_subscription = UserSubscriptions(
            user_id=user_id,
            plan_id=plan.id,
            plan_start=now,
            plan_end=end_of_month(now),
            price_id=plan.stripe_price_id,
            contact_credit_plan_id=plan.contact_credit_plan_id,
        )

        self.db.add(user_subscription)
        return user_subscription

    def set_current_subscription(
        self, user_id: int, subscription_id: int, plan: SubscriptionPlan
    ):
        user = self.db.execute(
            select(Users).where(Users.id == user_id)
        ).scalar()

        blocked_leads = (
            self.db.query(LeadUser)
            .filter_by(user_id=user_id, is_active=False)
            .order_by(LeadUser.id.asc())
            .limit(plan.leads_credits)
            .all()
        )
        to_unlock_count = len(blocked_leads)
        for lead in blocked_leads:
            lead.is_active = True
            self.db.add(lead)

        remaining_credits = plan.leads_credits - to_unlock_count
        user.current_subscription_id = subscription_id
        user.leads_credits = remaining_credits
        user.validation_funds = plan.validation_funds
        user.enrichment_credits = plan.enrichment_credits
        user.premium_source_credits = plan.premium_source_credits
        user.smart_audience_quota = plan.smart_audience_quota
        self.db.add(user)
