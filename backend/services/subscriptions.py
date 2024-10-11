import logging
from datetime import datetime, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session

from models.plans import SubscriptionPlan
from models.subscription_transactions import SubscriptionTransactions
from models.subscriptions import Subscription, UserSubscriptions
from models.users_payments_transactions import UsersPaymentsTransactions
from models.users import Users, User
from persistence.plans_persistence import PlansPersistence
from persistence.user_persistence import UserPersistence
from utils import get_utc_aware_date_for_postgres
from .stripe_service import determine_plan_name_from_product_id

ACTIVE_STATUSES = ["active", "trialing", "completed"]
TRIAL_STUB_PLAN_ID = '1'
PRICE_CREDIT = 0.49
logger = logging.getLogger(__name__)


class SubscriptionService:
    def __init__(self, db: Session, user_persistence_service: UserPersistence, plans_persistence: PlansPersistence):
        self.plans_persistence = plans_persistence
        self.db = db
        self.user_persistence_service = user_persistence_service

    def get_userid_by_customer(self, customer_id):
        return self.db.query(User).filter(User.customer_id == customer_id).first()

    def check_duplicate_send(self, stripe_request_created_at, user_id):
        subscription_data = self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).order_by(Subscription.plan_end.desc()).first()
        if subscription_data:
            if subscription_data.stripe_request_created_at is not None:
                if stripe_request_created_at <= subscription_data.stripe_request_created_at:
                    return True
        return False
    
    def check_duplicate_payments_send(self, stripe_request_created_at, user_id):
        user_payment_transaction = self.db.query(UsersPaymentsTransactions).filter(
                UsersPaymentsTransactions.user_id == user_id
            ).order_by(UsersPaymentsTransactions.id.desc()).first()
        if user_payment_transaction:
            if user_payment_transaction.stripe_request_created_at is not None:
                if stripe_request_created_at <= user_payment_transaction.stripe_request_created_at:
                    return True
        return False

    def is_user_have_subscription(self, user_id):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.user_id == user_id).limit(1).scalar()
    
    def get_subscription_by_user_id(self, user_id):
        user_subscription = self.db.query(UserSubscriptions).filter(
                UserSubscriptions.user_id == user_id
            ).order_by(UserSubscriptions.id.desc()).limit(1).first()
        return user_subscription

    def update_user_payment_status(self, user_id, status):
        if status in ["active", "succeeded"]:
            status = "active"
        elif status in ["incomplete", "requires_action", "pending"]:
            status = "inactive"
        else:
            status = "canceled"

        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.payment_status: status},
            synchronize_session=False
        )
        self.db.commit()

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
                    "users_limit": subscription.users_limit,
                    "integrations_limit": subscription.integrations_limit
                }
            }
        }
        return response

    def is_user_has_active_subscription(self, user_id):
        user_plan = self.db.query(UserSubscriptions.plan_end).filter(
            UserSubscriptions.user_id == user_id,
            UserSubscriptions.status.in_(('active', 'canceled'))
        ).order_by(desc(UserSubscriptions.plan_end)).first()
        if user_plan:
            if user_plan.plan_end:
                current_date = datetime.now()
                if user_plan.plan_end > current_date:
                    return True
            else:
                return True
        return False
    
    def create_payments_transaction(self, user_id, stripe_payload):
        created_timestamp = stripe_payload.get("created")
        payment_intent = stripe_payload.get("data", {}).get("object", {})
        transaction_id = payment_intent.get("id")
        created_at = datetime.fromtimestamp(created_timestamp, timezone.utc).replace(tzinfo=None) if created_timestamp else None
        amount_credits = int(payment_intent.get("amount")) / 100 / PRICE_CREDIT
        status = payment_intent.get("status")
        if status == 'succeeded':
            payment_transaction_obj = UsersPaymentsTransactions(
                user_id=user_id,
                transaction_id=transaction_id,
                created_at = datetime.now(),
                stripe_request_created_at = created_at,
                status=status,
                amount_credits=amount_credits,
                type='buy_credits'
            )
            self.db.add(payment_transaction_obj)
            self.db.commit()
        
    def create_subscription_transaction(self, user_id, stripe_payload: dict):
        start_date_timestamp = stripe_payload.get("data").get("object").get("current_period_start")
        stripe_request_created_timestamp = stripe_payload.get("created")
        stripe_request_created_at = datetime.fromtimestamp(stripe_request_created_timestamp, timezone.utc).replace(tzinfo=None)
        end_date_timestamp = stripe_payload.get("data").get("object").get("current_period_end")
        start_date = datetime.fromtimestamp(start_date_timestamp, timezone.utc).replace(tzinfo=None)
        end_date = datetime.fromtimestamp(end_date_timestamp, timezone.utc).replace(tzinfo=None)
        created_at = get_utc_aware_date_for_postgres()
        currency = stripe_payload.get("data").get("object").get("currency")
        price = int(stripe_payload.get("data").get("object").get("plan").get("amount_decimal")) / 100
        price_id = stripe_payload.get("data").get("object").get("plan").get("id")
        status = stripe_payload.get("data").get("object").get("status")
        plan_type = determine_plan_name_from_product_id(
            stripe_payload.get("data").get("object").get("plan").get("product"))
        payment_platform_subscription_id = stripe_payload.get("data").get("object").get("id")
        plan_name = f"{plan_type} at ${price}"
        transaction_id = stripe_payload.get("id")
        plan_id = self.plans_persistence.get_plan_by_title(plan_type)
        subscription_transaction_obj = SubscriptionTransactions(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            currency=currency,
            price_id=price_id,
            plan_id=plan_id,
            transaction_id=transaction_id,
            platform_subscription_id=payment_platform_subscription_id,
            plan_name=plan_name,
            created_at=created_at,
            status=status,
            stripe_request_created_at=stripe_request_created_at
        )
        self.db.add(subscription_transaction_obj)
        self.db.commit()
        return subscription_transaction_obj

    def create_subscription_from_webhook(self, user_id, stripe_payload: dict):
        stripe_request_created_timestamp = stripe_payload.get("created")
        start_date_timestamp = stripe_payload.get("data").get("object").get("current_period_start")
        end_date_timestamp = stripe_payload.get("data").get("object").get("current_period_end")
        start_date = datetime.fromtimestamp(start_date_timestamp, timezone.utc).replace(tzinfo=None)
        end_date = datetime.fromtimestamp(end_date_timestamp, timezone.utc).replace(tzinfo=None)
        stripe_request_created_at = datetime.fromtimestamp(stripe_request_created_timestamp, timezone.utc).replace(tzinfo=None)
        stripe_status = stripe_payload.get("data").get("object").get("status")
        if stripe_status in ["active", "succeeded"]:
            status = "active"
        elif stripe_status in ["incomplete", "requires_action", "pending"]:
            status = "inactive"
        else:
            status = "canceled"
        plan_type = determine_plan_name_from_product_id(
            stripe_payload.get("data").get("object").get("plan").get("product"))
        payment_platform_subscription_id = stripe_payload.get("data").get("object").get("id")
        plan_id = self.plans_persistence.get_plan_by_title(plan_type)
        subscription_obj = Subscription(
            user_id=user_id,
            status=status,
            plan_start=start_date,
            plan_end=end_date,
            platform_subscription_id=payment_platform_subscription_id,
            plan_id=plan_id,
            stripe_request_created_at=stripe_request_created_at,
        )
        if status == "active":
            domains_limit, users_limit, integrations_limit, leads_credits, prospect_credits, members_limit = self.plans_persistence.get_plan_limit_by_id(
            plan_id=plan_id)
            subscription_obj.users_limit = users_limit
            subscription_obj.domains_limit = domains_limit
            subscription_obj.integrations_limit = integrations_limit
            subscription_obj.members_limit = members_limit - 1
            
            user = self.db.query(User).filter(User.id == user_id).first()
            user.leads_credits = leads_credits
            user.prospect_credits = prospect_credits
            
        self.db.add(subscription_obj)
        self.db.commit()
        return subscription_obj
    
    def create_payment_from_webhook(self, user_id, stripe_payload):
        payment_intent = stripe_payload.get("data", {}).get("object", {})
        amount_credits = int(payment_intent.get("amount")) / 100 / PRICE_CREDIT
        status = payment_intent.get("status")
        if status == "succeeded":
            user = self.db.query(User).filter(User.id == user_id).first()
            if user.prospect_credits is None:
                user.prospect_credits = 0
            user.prospect_credits += amount_credits
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
        domains_limit, users_limit, integrations_limit, leads_credits, prospect_credits, members_limit = self.plans_persistence.get_plan_limit_by_id(
            plan_id=plan.id)
        add_subscription_obj = Subscription(
            domains_limit=domains_limit,
            integrations_limit=integrations_limit,
            user_id=user_id,
            users_limit=users_limit,
            updated_at=created_at.isoformat() + "Z",
            created_at=created_at.isoformat() + "Z",
            members_limit=members_limit - 1,
            status=status,
            plan_id=plan.id,
            is_trial=True
        )
        self.db.add(add_subscription_obj)

        self.db.query(User).filter(User.id == user_id).update({User.activate_steps_percent: 50,
                                                               User.leads_credits: leads_credits,
                                                               User.prospect_credits: prospect_credits
                                                               },
                                                              synchronize_session=False)
        self.db.commit()

    def remove_trial(self, user_id: int):
        trial_subscription = self.db.query(UserSubscriptions).filter(
                UserSubscriptions.user_id == user_id
            ).order_by(UserSubscriptions.id.desc()).limit(1).scalar()
        trial_subscription.is_trial = False
        trial_subscription.updated_at = datetime.now()
        trial_subscription.plan_end = datetime.now()
        self.db.commit()

    def get_subscription_by_user_id(self, user_id):
        return self.db.query(UserSubscriptions).filter(
            UserSubscriptions.user_id == user_id
        ).order_by(UserSubscriptions.id.desc()).limit(1).scalar()
    
    def get_user_subscription_by_platform_subscription_id(self, platform_subscription_id):
        user_subscription = self.db.query(UserSubscriptions).filter(
            UserSubscriptions.platform_subscription_id == platform_subscription_id
        ).first() 

        return user_subscription
    
    def get_additional_credits_price_id(self):
        stripe_price_id = self.db.query(SubscriptionPlan.stripe_price_id).filter(
            SubscriptionPlan.title == 'Additional_prospect_credits'
        ).scalar()
        return stripe_price_id

    
    def update_subscription_from_webhook(self, user_subscription :UserSubscriptions, stripe_payload):
        start_date_timestamp = stripe_payload.get("data").get("object").get("current_period_start")
        stripe_request_created_timestamp = stripe_payload.get("created")
        stripe_request_created_at = datetime.fromtimestamp(stripe_request_created_timestamp, timezone.utc).replace(tzinfo=None)
        end_date_timestamp = stripe_payload.get("data").get("object").get("current_period_end")
        start_date = datetime.fromtimestamp(start_date_timestamp, timezone.utc).replace(tzinfo=None)
        end_date = datetime.fromtimestamp(end_date_timestamp, timezone.utc).replace(tzinfo=None)
        stripe_status = stripe_payload.get("data").get("object").get("status")

        if stripe_status in ["active", "succeeded"]:
            status = "active"
        elif stripe_status in ["incomplete", "requires_action", "pending"]:
            status = "inactive"
        else:
            status = "canceled"

        plan_type = determine_plan_name_from_product_id(
            stripe_payload.get("data").get("object").get("plan").get("product"))
        plan_id = self.plans_persistence.get_plan_by_title(plan_type)
        domains_limit, users_limit, integrations_limit, leads_credits, prospect_credits, members_limit = self.plans_persistence.get_plan_limit_by_id(
            plan_id=plan_id)
        if status != "canceled":
            user_subscription.plan_start = start_date
            user_subscription.plan_end = end_date
            user_subscription.domains_limit = domains_limit
            user_subscription.users_limit = users_limit
            user_subscription.integrations_limit = integrations_limit
            user_subscription.plan_id=plan_id,
            user_subscription.members_limit=members_limit - 1,
            user_subscription.stripe_request_created_at = stripe_request_created_at
        user_subscription.status = status
        user_subscription.updated_at = stripe_request_created_at
        self.db.flush()

        if status == "active":
            user = self.db.query(User).filter(User.id == user_subscription.user_id).first()
            user.leads_credits = leads_credits if user.leads_credits >= 0 else  leads_credits - user.leads_credits
            user.prospect_credits = prospect_credits
        self.db.commit()
        return user_subscription
    
    def get_invitation_limit(self, user_id):
        member_limit =self.db.query(UserSubscriptions.members_limit).filter(
            UserSubscriptions.user_id == user_id
        ).order_by(UserSubscriptions.id.desc()).limit(1).scalar()
        return member_limit
    
    
    def check_invitation_limit(self, user_id):
        member_limit =self.db.query(UserSubscriptions.members_limit).filter(
            UserSubscriptions.user_id == user_id
        ).order_by(UserSubscriptions.id.desc()).limit(1).scalar()
        if member_limit <= 0:
            return False
        return True
    
    def update_invitation_limit(self, user_id, invitation_limit):
        member_limit = self.db.query(UserSubscriptions).filter(
            UserSubscriptions.user_id == user_id
        ).order_by(UserSubscriptions.id.desc()).limit(1).first()
        member_limit.members_limit = member_limit.members_limit + invitation_limit
        self.db.commit()