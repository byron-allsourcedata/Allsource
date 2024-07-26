import logging
from services.subscriptions import SubscriptionService
from datetime import datetime

ACTIVE_STATUSES = ["active", "trialing", "completed"]
TRIAL_STUB_PLAN_ID = '1'
logger = logging.getLogger(__name__)


class WebhookService:
    def __init__(self, subscription_service: SubscriptionService):
        self.subscription_service = subscription_service

    def update_payment_confirmation(self, payload):
        stripe_request_created_timestamp = payload.get("created")
        stripe_request_created_at = datetime.utcfromtimestamp(stripe_request_created_timestamp).isoformat() + "Z"
        customer_id = payload.get("data").get("object").get("customer")
        user_data = self.subscription_service.get_userid_by_customer(customer_id)
        if self.subscription_service.check_duplicate_send(stripe_request_created_at, user_data.id):
            return payload
        request_price_id = payload.get("data").get("object").get("plan").get("id")
        status = payload.get("data").get("object").get("status")
        is_subscription_active = status in ['active', 'trialing']
        current_plan = self.subscription_service.get_current_user_plan(user_data.id)
        if current_plan is not None:
            user_plan, plan_info = current_plan
        else:
            plan_info = {'stripe_price_id': 0}

        """
        Saving the details of payment mode
        """

        saved_details_of_payment = self.subscription_service.save_payment_details_in_stripe(customer_id=customer_id)
        if saved_details_of_payment:
            logger.info("saved details of payment for success")

        """
        Logic for existing or new subscription, credits and credit usage
        """
        self.subscription_service.update_user_payment_status(user_id=user_data.id, is_success=is_subscription_active)
        logger.info(f"updated the payment status of user to completed {user_data.email}")
        user_subscription = self.subscription_service.create_subscription_from_webhook(user_id=user_data.id,
                                                                                       stripe_payload=payload)
        if user_subscription:
            logger.info("New subscription created")

        if (plan_info["stripe_price_id"] != request_price_id):
            self.subscription_service.create_new_usp(user_data.id, user_subscription.id, request_price_id)
        else:
            self.subscription_service.update_subscription_id(user_plan["id"], user_subscription.id)
        return self.subscription_service.construct_webhook_response(user_subscription)
