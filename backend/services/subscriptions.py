import logging
from datetime import datetime
from enums import StripePaymentStatusEnum
from models.plans import SubscriptionPlan, UserSubscriptionPlan
from models.users import Users, User
from persistence.user_persistence import UserPersistence
from models.subscriptions import Subscription
from sqlalchemy.orm import Session

from utils import get_utc_aware_date_for_postgres

ACTIVE_STATUSES = ["active", "trialing", "completed"]
TRIAL_STUB_PLAN_ID = '1'
logger = logging.getLogger(__name__)


class SubscriptionService:
    def __init__(self, db: Session, user_persistence_service: UserPersistence):
        self.db = db
        self.user_persistence_service = user_persistence_service

    def get_subscription(self, user_id: int):
        subscription = self.db.query(Subscription).filter(Subscription.user_id == user_id).order_by(
            Subscription.created_at.desc()).first()
        return subscription

    def get_userid_by_customer(self, customer_id):
        return self.db.query(User).filter(User.customer_id == customer_id).first()
    def get_current_user_plan(self, user_id):
        user_plan_db, plan_info_db = self.user_persistence_service.user_plan_info_db(user_id)
        user_plan = user_plan_db.__dict__
        plan_info = plan_info_db.__dict__
        if user_plan["is_trial"]:
            trial_plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.id == TRIAL_STUB_PLAN_ID).first()
            plan_info["search_results_limit"] = trial_plan.search_results_limit
            plan_info["viewed_profiles_limit"] = trial_plan.viewed_profiles_limit
            plan_info["is_payment_integration_allow"] = trial_plan.is_payment_integration_allow
            plan_info["team_size_limit"] = trial_plan.team_size_limit
            plan_info["emails_integration_limit"] = trial_plan.emails_integration_limit
            plan_info["exports_limit"] = trial_plan.exports_limit
            plan_info["viewed_emails_limit"] = trial_plan.viewed_emails_limit
            plan_info["is_advanced_search_allow"] = trial_plan.is_advanced_search_allow
            plan_info["is_payouts_allow"] = trial_plan.is_payouts_allow

        if user_plan["subscription_id"] is None:
            user_subscription = self.subscription_service.get_subscription(self.user.id)
            if user_subscription:
                self.update_subscription_id(user_plan["id"], user_subscription.id)

        return (user_plan, plan_info)

    def is_had_trial_period(self, user_id):
        self.db.query(UserSubscriptionPlan, User).join(SubscriptionPlan,
                                                                   UserSubscriptionPlan.user_id == user_id).first()

    def update_user_payment_status(self, user_id, is_success):
        if is_success:
            payment_state_id = StripePaymentStatusEnum.COMPLETE.value
        else:
            payment_state_id = StripePaymentStatusEnum.FAILED.value
        result = (
            self.db.query(Users)
            .filter(Users.id == user_id)
            .update(
                {Users.payment_status: payment_state_id},
                synchronize_session=False,
            )
        )
        self.db.commit()

        if not result:
            return False
        return True

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
                    "is_trial": subscription.is_trial,
                    "created_at": subscription.created_at,
                }
            }
        }

        return response

    def is_active(sub_status, end_date):
        if sub_status == 'canceled':
            return end_date >= datetime.now()
        else:
            return sub_status in ACTIVE_STATUSES

    def determine_plan_name_from_price(self, product_id):
        import stripe

        product = stripe.Product.retrieve(product_id)
        return product.name

    def create_subscription_from_webhook(self, user_id, stripe_payload: dict, is_trial):

        start_date_timestamp = stripe_payload.get("data").get("object").get("current_period_start")
        end_date_timestamo = stripe_payload.get("data").get("object").get("current_period_end")
        start_date = datetime.utcfromtimestamp(start_date_timestamp).isoformat() + "Z"
        end_date = datetime.utcfromtimestamp(end_date_timestamo).isoformat() + "Z"

        created_by_id = user_id
        created_at = get_utc_aware_date_for_postgres()

        currency = stripe_payload.get("data").get("object").get("currency")
        price = int(stripe_payload.get("data").get("object").get("plan").get("amount_decimal")) / 100
        price_id = stripe_payload.get("data").get("object").get("plan").get("id")
        status = stripe_payload.get("data").get("object").get("status")

        plan_interval = stripe_payload.get("data").get("object").get("plan").get("interval")
        plan_type = self.determine_plan_name_from_price(
            stripe_payload.get("data").get("object").get("plan").get("product"))

        payment_platform_subscription_id = stripe_payload.get("data").get("object").get("id")

        if not is_trial:
            plan_name = f"{plan_type} (at ${price} / {plan_interval})"
        else:
            plan_name = f"Trial of {plan_type} at ${price}"

        transaction_id = stripe_payload.get("id")

        add_subscription_obj = Subscription(
            user_id=created_by_id,
            plan_name=plan_name,
            plan_start=start_date,
            plan_end=end_date,
            is_trial=is_trial,
            currency=currency,
            price=price,
            price_id=price_id,
            subscription_id=payment_platform_subscription_id,
            transaction_id=transaction_id,
            PaymentPlatformName="stripe",
            updated_at=created_at,
            updated_by=created_by_id,
            created_at=created_at,
            created_by=created_by_id,
            status=status,
        )
        self.db.add(add_subscription_obj)
        self.db.commit()
        return add_subscription_obj
