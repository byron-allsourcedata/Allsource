import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from enums import StripePaymentStatusEnum
from models.plans import SubscriptionPlan
from models.subscription_transactions import SubscriptionTransactions
from models.subscriptions import Subscription, UserSubscriptions
from models.users import Users, User
from persistence.plans_persistence import PlansPersistence
from persistence.user_persistence import UserPersistence
from utils import get_utc_aware_date_for_postgres

ACTIVE_STATUSES = ["active", "trialing", "completed"]
TRIAL_STUB_PLAN_ID = '1'
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
        ).first()

        if subscription_data:
            stripe_request_created_at_dt = datetime.fromisoformat(stripe_request_created_at.replace('Z', ''))
            if subscription_data.stripe_request_created_at is not None:
                subscription_stripe_request_created_at = subscription_data.stripe_request_created_at.replace(
                    tzinfo=None)

                if stripe_request_created_at_dt < subscription_stripe_request_created_at:
                    return True
                else:
                    return False
            else:
                return False

        return False

    def get_current_user_plan(self, user_id):
        return self.user_persistence_service.user_plan_info_db(user_id)

    def is_user_have_subscription(self, user_id):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.user_id == user_id).limit(1).scalar()

    def update_user_payment_status(self, user_id, is_success):
        if is_success:
            payment_state = StripePaymentStatusEnum.COMPLETE.value
        else:
            payment_state = StripePaymentStatusEnum.FAILED.value
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.payment_status: payment_state},
            synchronize_session=False
        )
        self.db.commit()

    def save_payment_details_in_stripe(self, customer_id):
        import stripe

        try:
            payment_method_id = (
                stripe.PaymentMethod.list(
                    customer=customer_id,
                    type="card",
                )
                .data[0]
                .get("id")
            )

            stripe.Customer.modify(
                customer_id,
                invoice_settings={"default_payment_method": payment_method_id},
            )

            return True
        except Exception as e:

            logger.info(f"Getting error while saving the info of default payment details {str(e)}")
            return False

    def construct_webhook_response(self, subscription):
        response = {
            "success_msg": {
                "subscription": {
                    "plan_name": subscription.plan_name,
                    "user_id": subscription.user_id,
                    "currency": subscription.currency,
                    "price": subscription.price,
                    "subscription_id": subscription.subscription_id,
                    "plan_start": subscription.plan_start,
                    "plan_end": subscription.plan_end,
                    "created_at": subscription.created_at,
                }
            }
        }
        return response

    def is_user_has_active_subscription(self, user_id):
        user_plan = self.db.query(
            UserSubscriptions.plan_end
        ).filter(
            UserSubscriptions.user_id == user_id,
        ).order_by(
            UserSubscriptions.id.desc()).first()
        if user_plan and user_plan.plan_end:
            current_date = datetime.now()
            if user_plan.plan_end > current_date:
                return True
        return False

    def determine_plan_name_from_price(self, product_id):
        import stripe
        product = stripe.Product.retrieve(product_id)
        return product.name

    def create_subscription_transaction(self, user_id, stripe_payload: dict):
        start_date_timestamp = stripe_payload.get("data").get("object").get("current_period_start")
        stripe_request_created_timestamp = stripe_payload.get("created")
        stripe_request_created_at = datetime.utcfromtimestamp(stripe_request_created_timestamp).isoformat() + "Z"
        end_date_timestamp = stripe_payload.get("data").get("object").get("current_period_end")
        start_date = datetime.utcfromtimestamp(start_date_timestamp).isoformat() + "Z"
        end_date = datetime.utcfromtimestamp(end_date_timestamp).isoformat() + "Z"
        created_at = get_utc_aware_date_for_postgres()
        currency = stripe_payload.get("data").get("object").get("currency")
        price = int(stripe_payload.get("data").get("object").get("plan").get("amount_decimal")) / 100
        price_id = stripe_payload.get("data").get("object").get("plan").get("id")
        status = stripe_payload.get("data").get("object").get("status")
        plan_type = self.determine_plan_name_from_price(
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
        start_date_timestamp = stripe_payload.get("data").get("object").get("current_period_start")
        stripe_request_created_timestamp = stripe_payload.get("created")
        stripe_request_created_at = datetime.utcfromtimestamp(stripe_request_created_timestamp).isoformat() + "Z"
        end_date_timestamp = stripe_payload.get("data").get("object").get("current_period_end")
        start_date = datetime.utcfromtimestamp(start_date_timestamp).isoformat() + "Z"
        end_date = datetime.utcfromtimestamp(end_date_timestamp).isoformat() + "Z"

        status = stripe_payload.get("data").get("object").get("status")

        plan_type = self.determine_plan_name_from_price(
            stripe_payload.get("data").get("object").get("plan").get("product"))
        payment_platform_subscription_id = stripe_payload.get("data").get("object").get("id")
        plan_id = self.plans_persistence.get_plan_by_title(plan_type)
        transaction_id = stripe_payload.get("id")
        add_subscription_obj = Subscription(
            user_id=user_id,
            plan_name=plan_type,
            plan_start=start_date,
            plan_end=end_date,
            transaction_id=transaction_id,
            status=status,
            payment_platform_product_id=payment_platform_subscription_id,
            plan_id=plan_id,
            is_trial='',
            stripe_request_created_at=stripe_request_created_at
        )
        self.db.add(add_subscription_obj)
        self.db.commit()
        return add_subscription_obj

    def create_subscription_from_free_trial(self, user_id):
        plan_type = 'FreeTrail'
        price = '0'
        status = 'trialing'
        created_by_id = user_id
        created_at = datetime.strptime(get_utc_aware_date_for_postgres(), '%Y-%m-%dT%H:%M:%SZ')  # Updated format
        plan_name = f"{plan_type} at ${price}"

        subscription = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_free_trial == True).first()
        trial_days = timedelta(days=subscription.trial_days)
        end_date = (created_at + trial_days).isoformat() + "Z"

        add_subscription_obj = Subscription(
            user_id=created_by_id,
            plan_name=plan_name,
            price=price,
            plan_start=created_at.isoformat() + "Z",
            plan_end=end_date,
            updated_at=created_at.isoformat() + "Z",
            updated_by=created_by_id,
            created_at=created_at.isoformat() + "Z",
            created_by=created_by_id,
            status=status,
        )

        self.db.add(add_subscription_obj)
        self.db.query(User).filter(User.id == user_id).update({Users.activate_steps_percent: 50},
                                                              synchronize_session=False)
        self.db.commit()
        return add_subscription_obj

    def create_new_usp_free_trial(self, user_id, subscription_id):
        plan_info = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_free_trial == True).first()
        usp_object = UserSubscriptionPlan(user_id=user_id, plan_id=plan_info.id, subscription_id=subscription_id,
                                          is_trial=True)
        self.db.add(usp_object)
        self.db.commit()
        return usp_object

    def create_new_usp(self, user_id, subscription_id, stripe_price_id):
        plan_info = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.stripe_price_id == stripe_price_id).first()
        usp_object = UserSubscriptionPlan(user_id=user_id, plan_id=plan_info.id, subscription_id=subscription_id)
        self.db.add(usp_object)
        self.db.commit()
        return usp_object

    def update_subscription_id(self, usp_id, subscription_id):
        self.db.query(UserSubscriptions) \
            .filter(UserSubscriptions.id == usp_id) \
            .update({UserSubscriptions.subscription_id: subscription_id}, synchronize_session=False)
        self.db.commit()

    def remove_trial(self, user_id: int):
        user_subcription_plan = self.db.query(UserSubscriptionPlan).join(SubscriptionPlan,
                                                                         SubscriptionPlan.id == UserSubscriptionPlan.plan_id).filter(
            UserSubscriptionPlan.user_id == user_id, SubscriptionPlan.is_free_trial == True).order_by(
            UserSubscriptionPlan.created_at.desc()).first()
        self.db.query(UserSubscriptionPlan).filter(UserSubscriptionPlan.id == user_subcription_plan.id).update(
            {UserSubscriptionPlan.is_trial: False,
             UserSubscriptionPlan.updated_at: datetime.now()})
        self.db.query(Subscription).filter(Subscription.id == user_subcription_plan.subscription_id).update(
            {Subscription.plan_end: datetime.now(), Subscription.updated_at: datetime.now()})
        self.db.commit()
