import logging
from datetime import datetime

from services.subscriptions import SubscriptionService
from .stripe_service import save_payment_details_in_stripe
logger = logging.getLogger(__name__)


class WebhookService:
    def __init__(self, subscription_service: SubscriptionService):
        self.subscription_service = subscription_service

    def update_subscription_confirmation(self, payload):
        stripe_request_created_timestamp = payload.get("created")
        stripe_request_created_at = datetime.utcfromtimestamp(stripe_request_created_timestamp).isoformat() + "Z"
        customer_id = payload.get("data").get("object").get("customer")
        user_data = self.subscription_service.get_userid_by_customer(customer_id)
        if not user_data:
            return payload
        
        if self.subscription_service.check_duplicate_send(stripe_request_created_at, user_data.id):
            return payload
        
        self.subscription_service.create_subscription_transaction(user_id=user_data.id,
                                                                    stripe_payload=payload)
        

        status = payload.get("data").get("object").get("status")

        """
        Saving the details of payment mode
        """

        saved_details_of_payment = save_payment_details_in_stripe(customer_id=customer_id)
        if saved_details_of_payment:
            logger.info("saved details of payment for success")

        """
        Logic for existing or new subscription, credits and credit usage
        """
        self.subscription_service.update_user_payment_status(user_id=user_data.id, status=status)
        logger.info(f"updated the payment status of user to completed {user_data.email}")
        platform_subscription_id = payload.get("data").get("object").get("id")
        user_subscription = self.subscription_service.get_user_subscription_by_platform_subscription_id(platform_subscription_id)
        if user_subscription:
            user_subscription = self.subscription_service.update_subscription_from_webhook(user_subscription=user_subscription, stripe_payload=payload)
            return user_subscription
        else:
            user_subscription = self.subscription_service.create_subscription_from_webhook(user_id=user_data.id, stripe_payload=payload)
            if user_subscription:
                logger.info("New subscription created")
                return self.subscription_service.construct_webhook_response(user_subscription)
                

    def cancel_subscription_confirmation(self, payload):
        stripe_request_created_timestamp = payload.get("created")
        stripe_request_created_at = datetime.utcfromtimestamp(stripe_request_created_timestamp).isoformat() + "Z"
        customer_id = payload.get("data").get("object").get("customer")
        user_data = self.subscription_service.get_userid_by_customer(customer_id)
        if not user_data:
            return payload
        
        if self.subscription_service.check_duplicate_send(stripe_request_created_at, user_data.id):
            return payload
        
        self.subscription_service.create_subscription_transaction(user_id=user_data.id,
                                                                    stripe_payload=payload)
        

        status = payload.get("data").get("object").get("status")

        """
        Saving the details of payment mode
        """

        saved_details_of_payment = save_payment_details_in_stripe(customer_id=customer_id)
        if saved_details_of_payment:
            logger.info("saved details of payment for success")

        """
        Logic for existing or new subscription, credits and credit usage
        """
        self.subscription_service.update_user_payment_status(user_id=user_data.id, status=status)
        logger.info(f"updated the payment status of user to completed {user_data.email}")
        platform_subscription_id = payload.get("data").get("object").get("id")
        user_subscription = self.subscription_service.get_user_subscription_by_platform_subscription_id(platform_subscription_id)
        if user_subscription:
            user_subscription = self.subscription_service.update_subscription_from_webhook(user_subscription, stripe_payload=payload)
            return self.subscription_service.construct_webhook_response(user_subscription)
        else:
            return payload

    def create_payment_confirmation(self, payload):
        stripe_request_created_timestamp = payload.get("created")
        stripe_request_created_at = datetime.utcfromtimestamp(stripe_request_created_timestamp).isoformat() + "Z"
        customer_id = payload.get("data").get("object").get("customer")
        user_data = self.subscription_service.get_userid_by_customer(customer_id)
        if not user_data:
            return payload
        
        if self.subscription_service.check_duplicate_payments_send(stripe_request_created_at, user_data.id):
            return payload
        
        
        """
        Saving the details of payment mode
        """

        saved_details_of_payment = save_payment_details_in_stripe(customer_id=customer_id)
        if saved_details_of_payment:
            logger.info("saved details of payment for success")

        """
        Logic for existing or new subscription, credits and credit usage
        """
        transaction_id = payload.get('data').get('object').get('id')
        
        user_payment_transaction_exist = self.subscription_service.get_user_payment_by_transaction_id(transaction_id)
        if user_payment_transaction_exist:
            self.subscription_service.update_payments_transaction(user_id=user_data.id,
                                                                    stripe_payload=payload, user_payment_transaction_id=user_payment_transaction_exist.id)
        else:
            self.subscription_service.create_payments_transaction(user_id=user_data.id,
                                                                    stripe_payload=payload)
        user_payment = self.subscription_service.create_payment_from_webhook(user_id=user_data.id, stripe_payload=payload)
        if user_payment:
            logger.info("New payment created")
            return user_payment
            