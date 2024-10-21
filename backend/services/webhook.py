import logging
from datetime import datetime, timezone

from services.subscriptions import SubscriptionService
from .stripe_service import save_payment_details_in_stripe

logger = logging.getLogger(__name__)


class WebhookService:
    def __init__(self, subscription_service: SubscriptionService):
        self.subscription_service = subscription_service

    def update_subscription_confirmation(self, payload):
        stripe_request_created_timestamp = payload.get("created")
        stripe_request_created_at = datetime.fromtimestamp(stripe_request_created_timestamp, timezone.utc).replace(
            tzinfo=None)
        data_object = payload.get("data").get("object")
        customer_id = data_object.get("customer")
        user_data = self.subscription_service.get_userid_by_customer(customer_id)
        if not user_data:
            return payload

        platform_subscription_id = data_object.get("id")
        price_id = data_object.get("plan").get("id")

        schedule = data_object.get("schedule")
        previous_attributes = data_object.get("previous_attributes")
        if previous_attributes and schedule is None:
            schedule = previous_attributes.get('schedule')
            if schedule is not None:
                return payload

        # if self.subscription_service.check_duplicate_send(stripe_request_created_at, platform_subscription_id,
        #                                                   price_id):
        #     return payload

        # self.subscription_service.create_subscription_transaction(user_id=user_data.id,
        #                                                           stripe_payload=payload)

        result_status = self.subscription_service.process_subscription(user=user_data, stripe_payload=data_object)
        if result_status == 'active':
            pass
            # saved_details_of_payment = save_payment_details_in_stripe(customer_id=customer_id)
            # if not saved_details_of_payment:
            #     logger.warning("set default card false")
        return result_status

    def cancel_subscription_confirmation(self, payload):
        stripe_request_created_timestamp = payload.get("created")
        stripe_request_created_at = datetime.fromtimestamp(stripe_request_created_timestamp, timezone.utc).replace(
            tzinfo=None)
        data_object = payload.get("data").get("object")
        customer_id = data_object.get("customer")
        user_data = self.subscription_service.get_userid_by_customer(customer_id)
        if not user_data:
            return payload

        platform_subscription_id = payload.get("data").get("object").get("id")
        price_id = payload.get("data").get("object").get("plan").get("id")

        if self.subscription_service.check_duplicate_send(stripe_request_created_at, platform_subscription_id,
                                                          price_id):
            return payload

        self.subscription_service.create_subscription_transaction(user_id=user_data.id,
                                                                  stripe_payload=payload)

        result_status = self.subscription_service.process_subscription(user=user_data, stripe_payload=data_object)
        return result_status

    def create_payment_confirmation(self, payload):
        data_object = payload.get("data").get("object")
        product_description = data_object.get('metadata').get('product_description')
        if product_description != 'leads_credits' or product_description != 'prospect_credits':
            return payload
        customer_id = data_object.get("customer")
        user_data = self.subscription_service.get_userid_by_customer(customer_id)
        if not user_data:
            return payload

        quantity = data_object.get('metadata').get('quantity')

        result_transaction = self.subscription_service.create_payments_transaction(user_id=user_data.id,
                                                                                   stripe_payload=payload,
                                                                                   product_description=product_description,
                                                                                   quantity=quantity)
        if not result_transaction:
            return payload

        user_payment = self.subscription_service.create_payment_from_webhook(user_id=user_data.id,
                                                                             stripe_payload=payload,
                                                                             product_description=product_description,
                                                                             quantity=quantity)
        return user_payment
