from datetime import datetime, timezone

from sqlalchemy import select, update

from db_dependencies import Db
from enums import PaymentStatus
from models import UserSubscriptions, Users, SubscriptionPlan, LeadUser
from resolver import injectable
from utils import end_of_month, maybe_unlimited


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

    def add_subscription_with_dates(
        self,
        user_id: int,
        plan: SubscriptionPlan,
        plan_start: datetime,
        plan_end: datetime,
    ):
        user_subscription = UserSubscriptions(
            user_id=user_id,
            plan_id=plan.id,
            plan_start=plan_start,
            plan_end=plan_end,
            price_id=plan.stripe_price_id,
            contact_credit_plan_id=plan.contact_credit_plan_id,
        )

        self.db.add(user_subscription)
        self.db.flush()
        return user_subscription

    def set_current_subscription(
        self, user_id: int, subscription_id: int, plan: SubscriptionPlan
    ):
        user = self.db.execute(
            select(Users).where(Users.id == user_id)
        ).scalar()

        limit = plan.leads_credits
        limit, is_unlimited = maybe_unlimited(limit, clamp_min=0)

        blocked_leads_query = (
            self.db.query(LeadUser)
            .filter_by(user_id=user_id, is_active=False)
            .order_by(LeadUser.id.asc())
        )

        if not is_unlimited:
            blocked_leads_query = blocked_leads_query.limit(limit)

        blocked_leads = blocked_leads_query.all()

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

    def subquery_current_sub_ids(self, alias):
        subquery_user_sub_ids = (
            select(Users.current_subscription_id)
            .join(
                UserSubscriptions,
                Users.current_subscription_id == UserSubscriptions.id,
            )
            .join(
                SubscriptionPlan,
                SubscriptionPlan.id == UserSubscriptions.plan_id,
            )
            .filter(SubscriptionPlan.alias == alias)
            .scalar_subquery()
        )
        return subquery_user_sub_ids

    def subquery_active_current_sub_ids_by_plan(self, alias):
        subquery_user_sub_ids = (
            select(Users.current_subscription_id)
            .join(
                UserSubscriptions,
                Users.current_subscription_id == UserSubscriptions.id,
            )
            .join(
                SubscriptionPlan,
                SubscriptionPlan.id == UserSubscriptions.plan_id,
            )
            .filter(
                SubscriptionPlan.alias == alias,
                UserSubscriptions.status == PaymentStatus.ACTIVE.value,
            )
            .scalar_subquery()
        )
        return subquery_user_sub_ids

    def get_lead_credits(self, alias):
        credits = (
            self.db.query(SubscriptionPlan.leads_credits)
            .filter(SubscriptionPlan.alias == alias)
            .scalar()
        )
        return credits

    def get_subscription_plan_by_id(self, id: int):
        subscription_plan = (
            self.db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.id == id)
            .first()
        )
        return subscription_plan

    def get_subscription_by_customer_id(self, customer_id: str):
        user_subscription = (
            self.db.query(UserSubscriptions)
            .join(Users, Users.current_subscription_id == UserSubscriptions.id)
            .filter(Users.customer_id == customer_id)
            .first()
        )
        return user_subscription

    def install_payment_status(self, customer_id: str, status):
        subquery = (
            select(Users.current_subscription_id)
            .where(Users.customer_id == customer_id)
            .scalar_subquery()
        )

        stmt_subs = (
            update(UserSubscriptions)
            .where(UserSubscriptions.id == subquery)
            .values(status=status)
        )

        result = self.db.execute(stmt_subs)
        self.db.commit()
        return result
