import logging
from datetime import datetime, timezone

from enums import NotificationTitles
from persistence.notification import NotificationPersistence
from services.subscriptions import SubscriptionService
from services.integrations.base import IntegrationService
from .stripe_service import save_payment_details_in_stripe, determine_plan_name_from_product_id

logger = logging.getLogger(__name__)


class WebhookService:
    def __init__(self, subscription_service: SubscriptionService, notification_persistence: NotificationPersistence, integration_service: IntegrationService):
        self.subscription_service = subscription_service
        self.notification_persistence = notification_persistence
        self.integration_service = integration_service
        

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

        if self.subscription_service.check_duplicate_send(stripe_request_created_at, platform_subscription_id,
                                                          price_id):
            return payload

        self.subscription_service.create_subscription_transaction(user_id=user_data.id,
                                                                  stripe_payload=payload)

        result = self.subscription_service.process_subscription(user=user_data, stripe_payload=data_object)
        lead_credit_plan_id = None
        if result['lead_credit_price']:
            plan = self.subscription_service.get_plan_by_price(lead_credit_price=result['lead_credit_price'])
            lead_credit_plan_id = plan.id
        if result['status'] == 'active':
            saved_details_of_payment = save_payment_details_in_stripe(customer_id=customer_id)
            if not saved_details_of_payment:
                logger.warning("set default card false")
        result = {
            'status': result['status'],
            'user': user_data,
            'lead_credit_plan_id': lead_credit_plan_id if lead_credit_plan_id else None
        }
        
        return result

    def cancel_subscription_confirmation(self, payload):
        message_body = {}
        stripe_request_created_timestamp = payload.get("created")
        stripe_request_created_at = datetime.fromtimestamp(stripe_request_created_timestamp, timezone.utc).replace(
            tzinfo=None)
        data_object = payload.get("data").get("object")
        customer_id = data_object.get("customer")
        stripe_status = data_object.get("status")
        user_data = self.subscription_service.get_userid_by_customer(customer_id)
        if not user_data:
            return payload

        platform_subscription_id = payload.get("data").get("object").get("id")
        plan = data_object.get("plan")
        if plan is None:
            if stripe_status == 'open' or stripe_status == 'past_due':
                account_notification = self.notification_persistence.get_account_notification_by_title(
                    NotificationTitles.PAYMENT_FAILED.value)
                save_account_notification = self.notification_persistence.save_account_notification(user_data.id,
                                                                                                    account_notification.id)
                stripe_request_created_timestamp = data_object.get("created")
                stripe_request_created_at = datetime.fromtimestamp(stripe_request_created_timestamp)
                message_body['user'] = user_data
                message_body['notification_id'] = save_account_notification.id
                message_body['full_name'] = user_data.full_name
                message_body['plan_name'] = determine_plan_name_from_product_id(
                    data_object['lines']['data'][0]['plan']['product'])
                message_body['date'] = stripe_request_created_at
                message_body['invoice_number'] = data_object.get("id")
                message_body['invoice_date'] = datetime.fromtimestamp(data_object.get("amount_due")).strftime(
                    '%Y-%m-%d %H:%M:%S')
                message_body['total'] = data_object.get("amount_due")
                message_body['link'] = data_object.get('hosted_invoice_url')

                return {
                    'status': stripe_status,
                    'message_body': message_body
                }

        price_id = plan.get("id")

        if self.subscription_service.check_duplicate_send(stripe_request_created_at, platform_subscription_id,
                                                          price_id):
            return payload

        self.subscription_service.create_subscription_transaction(user_id=user_data.id,
                                                                  stripe_payload=payload)

        self.subscription_service.process_subscription(user=user_data, stripe_payload=data_object)

        return {
            'status': stripe_status,
            'message_body': message_body
        }

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

        result_status = self.subscription_service.create_payment_from_webhook(user_id=user_data.id,
                                                                              stripe_payload=payload,
                                                                              product_description=product_description,
                                                                              quantity=quantity)
        return {
            'status': result_status,
            'user': user_data
        }
    
    def shopify_billing_update_webhook(self, payload):
        subscription_info = payload.get("app_subscription")
        shop_id = subscription_info.get("admin_graphql_api_shop_id").split('Shop/')[-1]
        logger.info(f'This is the shopify webhook request -> {repr(payload)}')
        user_data = self.subscription_service.get_user_by_shopify_shop_id(shop_id=shop_id)
        charge_id = subscription_info.get("admin_graphql_api_id").split('AppSubscription/')[-1]
        try:
            current_charge_id = int(user_data.charge_id)
            income_charge_id = int(charge_id)
            if income_charge_id < current_charge_id:
                return payload
        except Exception as e:
            logger.error("Can't check charge ids actuality")
            
        
        plan_name = subscription_info.get("name")
        if not user_data:
            logger.error("Not found user by shop id")
            return payload
        
        payment_period = None
        payment_amount = None
        with self.integration_service as service:
            shopify_charge = service.shopify.get_charge_by_id(user_data, charge_id)
            payment_amount = shopify_charge.price
            if shopify_charge.billing_on:
                billing_on = datetime.strptime(shopify_charge.billing_on, "%Y-%m-%d")
                activated_on = datetime.strptime(shopify_charge.activated_on, "%Y-%m-%d")
                delta_days = (billing_on - activated_on).days
                if delta_days <= 31:
                    payment_period = "month"
                else:
                    payment_period = "year"  
        if payment_period:
            plan = self.subscription_service.get_plan_by_title(plan_name, payment_period)
        else:
            plan = self.subscription_service.get_plan_by_title_price(plan_name, payment_amount)
            
        self.subscription_service.create_shopify_subscription_transaction(subscription_info=subscription_info, user_id=user_data.id, plan=plan)

        result = self.subscription_service.process_shopify_subscription(user=user_data, plan=plan, subscription_info=subscription_info, charge_id=charge_id)
        lead_credit_plan_id = None
        if result['lead_credit_price']:
            plan = self.subscription_service.get_plan_by_price(lead_credit_price=result['lead_credit_price'])
            lead_credit_plan_id = plan.id
                
        result = {
            'status': result['status'],
            'user': user_data,
            'lead_credit_plan_id': lead_credit_plan_id if lead_credit_plan_id else None
        }
        return result
        