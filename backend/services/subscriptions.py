import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models.plans import SubscriptionPlan
from models.subscription_transactions import SubscriptionTransactions
from models.subscriptions import Subscription, UserSubscriptions
from models.users import Users, User
from models.users_domains import UserDomains
from models.users_payments_transactions import UsersPaymentsTransactions
from persistence.plans_persistence import PlansPersistence
from persistence.user_persistence import UserPersistence
from utils import get_utc_aware_date_for_postgres
from decimal import *
from services.stripe_service import determine_plan_name_from_product_id

logger = logging.getLogger(__name__)


class SubscriptionService:
    def __init__(self, db: Session, user_persistence_service: UserPersistence, plans_persistence: PlansPersistence):
        self.plans_persistence = plans_persistence
        self.db = db
        self.user_persistence_service = user_persistence_service

    def get_userid_by_customer(self, customer_id):
        return self.db.query(User).filter(User.customer_id == customer_id).first()

    def cancellation_downgrade(self, subscription_id):
        self.db.query(UserSubscriptions).where(UserSubscriptions.id == subscription_id).update(
            {"downgrade_at": None, 'downgrade_price_id': None})
        self.db.commit()

    def check_duplicate_send(self, stripe_request_created_at, platform_subscription_id, price_id):
        subscription_data = self.db.query(SubscriptionTransactions).filter(
            SubscriptionTransactions.price_id == price_id,
            SubscriptionTransactions.platform_subscription_id == platform_subscription_id
        ).order_by(SubscriptionTransactions.stripe_request_created_at.desc()).first()
        if subscription_data:
            if subscription_data.stripe_request_created_at is not None:
                if isinstance(subscription_data.stripe_request_created_at, str):
                    subscription_datetime = datetime.strptime(subscription_data.stripe_request_created_at,
                                                              "%Y-%m-%d %H:%M:%S")
                else:
                    subscription_datetime = subscription_data.stripe_request_created_at

                if stripe_request_created_at <= subscription_datetime.replace(tzinfo=None):
                    return True
        return False

    def is_user_have_subscription(self, user_id):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.user_id == user_id).limit(1).scalar()

    def construct_webhook_response(self, subscription):
        response = {
            "success_msg": {
                "subscription": {
                    "user_id": subscription.user_id,
                    "plan_start": subscription.plan_start,
                    "plan_end": subscription.plan_end,
                    "created_at": subscription.created_at,
                    "status": subscription.status,
                    "platform_subscription_id": subscription.platform_subscription_id,
                    "plan_id": subscription.plan_id,
                    "stripe_request_created_at": subscription.stripe_request_created_at,
                    "domains_limit": subscription.domains_limit,
                    "integrations_limit": subscription.integrations_limit
                }
            }
        }
        return response

    def get_user_subscription(self, user_id):
        user_subscription = (
            self.db.query(UserSubscriptions)
            .join(User, User.current_subscription_id == UserSubscriptions.id)
            .filter(User.id == user_id)
            .first()
        )
        return user_subscription

    def is_user_has_active_subscription(self, user_id):
        user_subscription = self.get_user_subscription(user_id=user_id)
        if user_subscription:
            if user_subscription.is_trial and user_subscription.plan_end is None:
                return True
            if user_subscription.status in ('active', 'canceled'):
                user_subscription.plan_end = user_subscription.plan_end.replace(tzinfo=timezone.utc)
                return user_subscription.plan_end > datetime.now(timezone.utc)

        return False

    def is_trial_subscription(self, user_id):
        user_subscription = self.get_user_subscription(user_id=user_id)
        if user_subscription:
            if user_subscription.is_trial:
                return True

        return False

    def create_payments_transaction(self, user_id, stripe_payload, product_description, quantity):
        payment_intent = stripe_payload.get("data", {}).get("object", {})
        transaction_id = payment_intent.get("id")
        users_payments_transactions = self.db.query(UsersPaymentsTransactions).filter(
            UsersPaymentsTransactions.transaction_id == transaction_id).first()
        if not users_payments_transactions:
            created_timestamp = stripe_payload.get("created")
            created_at = datetime.fromtimestamp(created_timestamp, timezone.utc).replace(
                tzinfo=None) if created_timestamp else None
            status = payment_intent.get("status")
            if status == 'succeeded':
                payment_transaction_obj = UsersPaymentsTransactions(
                    user_id=user_id,
                    transaction_id=transaction_id,
                    created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                    stripe_request_created_at=created_at,
                    status=status,
                    amount_credits=quantity,
                    type=product_description
                )
                self.db.add(payment_transaction_obj)
                self.db.commit()
            return True
        return False

    def create_subscription_transaction(self, user_id, stripe_payload: dict):
        start_date_timestamp = stripe_payload.get("data").get("object").get("current_period_start")
        stripe_request_created_timestamp = stripe_payload.get("created")
        stripe_request_created_at = datetime.fromtimestamp(stripe_request_created_timestamp, timezone.utc).replace(
            tzinfo=None)
        end_date_timestamp = stripe_payload.get("data").get("object").get("current_period_end")
        start_date = datetime.fromtimestamp(start_date_timestamp, timezone.utc).replace(tzinfo=None)
        end_date = datetime.fromtimestamp(end_date_timestamp, timezone.utc).replace(tzinfo=None)
        created_at = get_utc_aware_date_for_postgres()
        currency = stripe_payload.get("data").get("object").get("currency")
        amount = Decimal(stripe_payload.get("data").get("object").get("plan").get("amount_decimal")) / Decimal(100)
        price_id = stripe_payload.get("data").get("object").get("plan").get("id")
        status = stripe_payload.get("data").get("object").get("status")
        plan_type = determine_plan_name_from_product_id(
            stripe_payload.get("data").get("object").get("plan").get("product"))
        interval = stripe_payload.get("data").get("object").get("plan").get("interval")
        payment_platform_subscription_id = stripe_payload.get("data").get("object").get("id")
        transaction_id = stripe_payload.get("id")
        plan_id = self.plans_persistence.get_plan_by_title(plan_type, interval)
        subscription_transaction_obj = SubscriptionTransactions(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            currency=currency,
            price_id=price_id,
            plan_id=plan_id,
            transaction_id=transaction_id,
            platform_subscription_id=payment_platform_subscription_id,
            plan_name=plan_type,
            created_at=created_at,
            status=status,
            stripe_request_created_at=stripe_request_created_at,
            amount=amount
        )
        self.db.add(subscription_transaction_obj)
        self.db.flush()
        return subscription_transaction_obj

    def create_payment_from_webhook(self, user_id, stripe_payload, product_description, quantity):
        payment_intent = stripe_payload.get("data", {}).get("object", {})
        amount_credits = quantity
        status = payment_intent.get("status")
        if status == "succeeded":
            if product_description == 'leads_credits':
                user = self.db.query(User).filter(User.id == user_id).first()
                if user.leads_credits is None:
                    user.leads_credits = 0
                user.leads_credits += int(amount_credits)
                self.db.commit()
            elif product_description == 'prospect_credits':
                user = self.db.query(User).filter(User.id == user_id).first()
                if user.prospect_credits is None:
                    user.prospect_credits = 0
                user.prospect_credits += int(amount_credits)
                self.db.commit()
        return stripe_payload

    def get_user_payment_by_transaction_id(self, transaction_id):
        user_payment_transaction = self.db.query(UsersPaymentsTransactions).filter(
            UsersPaymentsTransactions.transaction_id == transaction_id
        ).first()

        return user_payment_transaction

    def create_subscription_from_free_trial(self, user_id):
        plan = self.plans_persistence.get_free_trail_plan()
        status = 'active'
        created_at = datetime.strptime(get_utc_aware_date_for_postgres(), '%Y-%m-%dT%H:%M:%SZ')
        domains_limit, integrations_limit, leads_credits, prospect_credits, members_limit = self.plans_persistence.get_plan_limit_by_id(
            plan_id=plan.id)
        add_subscription_obj = Subscription(
            domains_limit=domains_limit,
            integrations_limit=integrations_limit,
            user_id=user_id,
            updated_at=created_at.isoformat() + "Z",
            created_at=created_at.isoformat() + "Z",
            members_limit=members_limit - 1,
            status=status,
            plan_id=plan.id,
            is_trial=True
        )
        self.db.add(add_subscription_obj)
        self.db.flush()
        self.db.query(User).filter(User.id == user_id).update({User.activate_steps_percent: 50,
                                                               User.leads_credits: leads_credits,
                                                               User.prospect_credits: prospect_credits,
                                                               User.current_subscription_id: add_subscription_obj.id
                                                               },
                                                              synchronize_session=False)
        self.db.commit()

    def remove_trial(self, user_id: int):
        trial_subscription = self.db.query(UserSubscriptions).filter(
            UserSubscriptions.user_id == user_id
        ).order_by(UserSubscriptions.id.desc()).limit(1).scalar()
        trial_subscription.is_trial = False

        trial_subscription.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        trial_subscription.plan_end = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.commit()

    def save_downgrade_price_id(self, price_id, subscription: UserSubscriptions):
        subscription.downgrade_price_id = price_id
        subscription.cancel_scheduled_at = None
        subscription.cancellation_reason = None
        subscription.downgrade_at = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.commit()

    def get_subscription_by_price_id(self, price_id):
        return self.db.query(UserSubscriptions).filter(UserSubscriptions.platform_subscription_id == price_id)

    def get_additional_credits_price_id(self):
        stripe_price_id = self.db.query(SubscriptionPlan.stripe_price_id).filter(
            SubscriptionPlan.title == 'Additional_prospect_credits'
        ).scalar()
        return stripe_price_id

    def update_users_domains(self, user_id, domains_limit):
        domains = self.db.query(UserDomains).filter(UserDomains.user_id == user_id).all()
        if domains:
            sorted_domains = sorted(domains, key=lambda x: x.created_at)
            for i, domain in enumerate(sorted_domains, start=1):
                domain.enable = i <= domains_limit
        self.db.commit()

    def update_team_members(self, team_owner_id, members_limit):
        if team_owner_id:
            users = self.db.query(Users).filter(Users.team_owner_id == team_owner_id).all()
            if users:
                sorted_users = sorted(users,
                                      key=lambda x: x.added_on or datetime.min)
                for i, user in enumerate(sorted_users, start=1):
                    if i >= members_limit:
                        self.db.delete(user)

                self.db.commit()

    def process_subscription(self, stripe_payload, user: Users):
        user_id = user.id
        platform_subscription_id = stripe_payload.get("id")
        price_id = stripe_payload.get("plan").get("id")
        canceled_at = stripe_payload.get("canceled_at")
        start_date_timestamp = stripe_payload.get("current_period_start")
        end_date_timestamp = stripe_payload.get("current_period_end")
        start_date = datetime.fromtimestamp(start_date_timestamp, timezone.utc).replace(tzinfo=None)
        end_date = datetime.fromtimestamp(end_date_timestamp, timezone.utc).replace(tzinfo=None)
        stripe_status = stripe_payload.get("status")
        if stripe_status in ["active", "succeeded"]:
            status = "active"
        elif stripe_status in ["incomplete", "requires_action", "pending", "past_due"]:
            status = "inactive"
        else:
            status = "canceled"

        if status == 'active':
            user_subscription = self.db.query(UserSubscriptions).where(
                UserSubscriptions.platform_subscription_id == platform_subscription_id,
                UserSubscriptions.price_id == price_id).first()
            plan_type = determine_plan_name_from_product_id(stripe_payload.get("plan").get("product"))
            interval = stripe_payload.get("plan").get("interval")
            plan_id = self.plans_persistence.get_plan_by_title(plan_type, interval)
            domains_limit, integrations_limit, leads_credits, prospect_credits, members_limit, lead_credit_price = self.plans_persistence.get_plan_limit_by_id(
                plan_id=plan_id)
            if user_subscription is not None and user_subscription.status == 'active':
                if canceled_at:
                    user_subscription.cancel_scheduled_at = datetime.fromtimestamp(canceled_at, timezone.utc).replace(
                        tzinfo=None)
                if start_date > user_subscription.plan_start:
                    user_subscription.plan_start = start_date
                    user_subscription.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
                    user_subscription.plan_end = end_date
                    user.leads_credits = leads_credits if user.leads_credits >= 0 else leads_credits - user.leads_credits
                    user.prospect_credits = prospect_credits
                self.db.flush()
            else:
                self.db.query(UserSubscriptions).where(UserSubscriptions.user_id == user_id).update(
                    {"status": "inactive", "updated_at": datetime.now(timezone.utc).replace(tzinfo=None)})
                self.db.flush()
                new_subscription = UserSubscriptions(
                    plan_start=start_date,
                    plan_end=end_date,
                    domains_limit=domains_limit,
                    integrations_limit=integrations_limit,
                    plan_id=plan_id,
                    members_limit=members_limit,
                    status=status,
                    created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                    user_id=user_id,
                    price_id=price_id,
                    platform_subscription_id=platform_subscription_id,
                    lead_credit_price=lead_credit_price
                )
                self.db.add(new_subscription)
                self.db.flush()
                self.update_users_domains(user_id, domains_limit)
                self.update_team_members(user.id, members_limit)
                user.leads_credits = leads_credits if user.leads_credits >= 0 else leads_credits - user.leads_credits
                user.prospect_credits = prospect_credits
                user.current_subscription_id = new_subscription.id
            self.db.commit()

        if status == "canceled" or status == 'inactive':
            self.db.query(UserSubscriptions).filter(
                UserSubscriptions.platform_subscription_id == platform_subscription_id,
                UserSubscriptions.price_id == price_id
            ).update({"status": status})

            self.db.commit()
        return status

    def get_invitation_limit(self, user_id):
        return len(self.user_persistence_service.get_combined_team_info(user_id=user_id)) + 1

    def check_invitation_limit(self, user_id):
        user_subscription = self.get_user_subscription(user_id)
        if user_subscription:
            subscription_member_limit = user_subscription.members_limit
            user_member_limit = len(self.user_persistence_service.get_combined_team_info(user_id=user_id)) + 1
            if user_member_limit < subscription_member_limit:
                return True

        return False
