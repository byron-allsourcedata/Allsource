import logging
from datetime import datetime

from services.subscriptions import SubscriptionService

logger = logging.getLogger(__name__)


class WebhookService:
    def __init__(self, subscription_service: SubscriptionService):
        self.subscription_service = subscription_service

    def update_payment_confirmation(self, payload):
        stripe_request_created_timestamp = payload.get("created")
        stripe_request_created_at = datetime.utcfromtimestamp(stripe_request_created_timestamp).isoformat() + "Z"
        customer_id = payload.get("data").get("object").get("customer")
        user_data = self.subscription_service.get_userid_by_customer(customer_id)
        if not user_data:
            return payload
        self.subscription_service.create_subscription_transaction(user_id=user_data.id,
                                                                  stripe_payload=payload)
        if self.subscription_service.check_duplicate_send(stripe_request_created_at, user_data.id):
            return payload

        status = payload.get("data").get("object").get("status")

        """
        Saving the details of payment mode
        """

        saved_details_of_payment = self.subscription_service.save_payment_details_in_stripe(customer_id=customer_id)
        if saved_details_of_payment:
            logger.info("saved details of payment for success")

        """
        Logic for existing or new subscription, credits and credit usage
        """
        self.subscription_service.update_user_payment_status(user_id=user_data.id, status=status)
        logger.info(f"updated the payment status of user to completed {user_data.email}")
        platform_subscription_id = payload.get("data").get("object").get("id")
        if self.subscription_service.subscription_exists(platform_subscription_id):
            self.subscription_service.update_subscription_from_webhook(platform_subscription_id, stripe_payload=payload)
        else:
            user_subscription = self.subscription_service.create_subscription_from_webhook(user_id=user_data.id,
                                                                                           stripe_payload=payload)
        if user_subscription:
            logger.info("New subscription created")

        return self.subscription_service.construct_webhook_response(user_subscription)
