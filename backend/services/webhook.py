import logging
from datetime import datetime
from enums import StripePaymentStatusEnum
from models.plans import SubscriptionPlan, UserSubscriptionPlan
from models.users import Users, User
from persistence.plans_persistence import PlansPersistence
from persistence.user_persistence import UserPersistence
from models.subscriptions import Subscription
from sqlalchemy.orm import Session

from services.subscriptions import SubscriptionService
from utils import get_utc_aware_date_for_postgres

ACTIVE_STATUSES = ["active", "trialing", "completed"]
TRIAL_STUB_PLAN_ID = '1'
logger = logging.getLogger(__name__)


class WebhookService:
    def __init__(self, plans_persistence: PlansPersistence, subscription_service: SubscriptionService):
        self.plans_persistence = plans_persistence
        self.subscription_service = subscription_service

    def update_payment_confirmation(self, payload):
        customer_id = payload.get("data").get("object").get("customer")
        request_price_id = payload.get("data").get("object").get("plan").get("id")
        status = payload.get("data").get("object").get("status")
        is_trial = status == "trialing"
        is_subscription_active = status in ['active', 'trialing']
        user_data = self.subscription_service.get_userid_by_customer(customer_id)
        user_plan, plan_info = self.subscription_service.get_current_user_plan(user_data.id)

        """
        Saving the details of payment mode
        """
        saved_details_of_payment = self.subscription_service.save_payment_details_in_stripe(customer_id=customer_id)
        if saved_details_of_payment:
            logger.info("saved details of payment for success")

        """
        Logic for existing or new subscription, credits and credit usage
        """
        update_payment_status_of_user = self.subscription_service.update_user_payment_status(user_id=self.user_data.id,
                                                                                             is_success=is_subscription_active)

        if update_payment_status_of_user:
            logger.info(f"updated the payment status of user to completed {self.user_data.email}")
            user_subscription = self.subscription_service.create_subscription_from_webhook(user_obj=self.user_data.id,
                                                                                           stripe_payload=payload,
                                                                                           is_trial=is_trial)
            if user_subscription:
                logger.info("New subscription created")

            # If this is new plan or end trial
            if (plan_info["stripe_price_id"] != request_price_id) or (
                    user_plan["is_trial"] == True and is_trial == False):
                self.create_new_usp(self.user_data.id, user_subscription.id, request_price_id, is_trial)
            else:
                if is_subscription_active:
                    self.reset_counters(user_plan["id"])
                self.update_subscription_id(user_plan["id"], user_subscription.id)

            return self.subscription_service.construct_webhook_response(user_subscription)
        return payload