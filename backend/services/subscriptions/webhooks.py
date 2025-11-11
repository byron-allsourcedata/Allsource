from enums import PaymentStatus
from persistence.user_persistence import UserPersistence
from persistence.user_subscriptions import UserSubscriptionsPersistence
from resolver import injectable
from services.stripe_service import (
    StripeService,
    save_payment_details_in_stripe,
)
from services.subscriptions.basic import BasicPlanService
from services.subscriptions.standard import StandardPlanService
from services.subscriptions.pixel_plan import PixelPlanService
from services.subscriptions.invoice import InvoiceService


@injectable
class SubscriptionWebhookService:
    def __init__(
        self,
        user_persistence: UserPersistence,
        basic_plan_service: BasicPlanService,
        stripe: StripeService,
        user_subscriptions_persistence: UserSubscriptionsPersistence,
        invoice_service: InvoiceService,
        standard_plan_service: StandardPlanService,
        pixel_plan_service: PixelPlanService,
    ):
        self.user_persistence = user_persistence
        self.basic_plan_service = basic_plan_service
        self.standard_plan_service = standard_plan_service
        self.pixel_plan_service = pixel_plan_service
        self.invoice_service = invoice_service
        self.stripe = stripe
        self.user_subscriptions_persistence = user_subscriptions_persistence

    def move_to_basic_plan(self, customer_id: str):
        self.basic_plan_service.move_to_basic_plan(customer_id)
        save_payment_details_in_stripe(customer_id=customer_id)

    def move_to_standard_plan(
        self, customer_id: str, subscription_id: str, plan_period: str
    ):
        self.standard_plan_service.move_to_standard_plan(
            customer_id, subscription_id, plan_period
        )
        save_payment_details_in_stripe(customer_id=customer_id)

    def move_to_pixel_plan(self, customer_id: str, subscription_id: str):
        self.pixel_plan_service.move_to_pixel_plan(customer_id, subscription_id)
        save_payment_details_in_stripe(customer_id=customer_id)

    def update_subscription_status(
        self,
        customer_id: str,
        status: str,
        action_type="update",
        stripe_subscription_id=None,
    ):
        print(action_type, stripe_subscription_id)
        subscription = (
            self.user_subscriptions_persistence.get_subscription_by_customer_id(
                customer_id=customer_id
            )
        )
        if not subscription:
            return

        if subscription.status == PaymentStatus.INACTIVE.value:
            record_subscription = (
                self.user_subscriptions_persistence.get_subscription_plan_by_id(
                    id=subscription.contact_credit_plan_id
                )
            )
            self.stripe.create_basic_plan_subscription(
                customer_id=customer_id,
                stripe_price_id=record_subscription.stripe_price_id,
            )

        if action_type == "create":
            self.standard_plan_service.move_to_standard_plan(
                customer_id=customer_id,
                subscription_id=stripe_subscription_id,
                plan_period="month",
            )

        else:
            self.user_subscriptions_persistence.install_payment_status(
                customer_id=customer_id, status=status
            )

    def save_invoice_payment(self, event_type: str, event: dict):
        customer_id = event["data"]["object"]["customer"]
        stripe_subscription_id = event["data"]["object"]["lines"]["data"][0][
            "parent"
        ]["subscription_item_details"]["subscription"]
        self.invoice_service.save_invoice_payment(
            event_type=event_type, invoices_data=event
        )
        self.user_persistence.decrease_overage_leads_count(
            customer_id=customer_id,
            quantity=event["data"]["object"]["lines"]["data"][0]["quantity"],
        )
        self.update_subscription_status(
            customer_id=customer_id,
            status=PaymentStatus.ACTIVE.value,
            action_type="create" if stripe_subscription_id else "update",
            stripe_subscription_id=stripe_subscription_id,
        )
        return "SUCCESS"

    def save_intent_payment(self, event_type: str, event: dict):
        self.invoice_service.save_invoice_payment(
            event_type=event_type, invoices_data=event
        )
        return "SUCCESS"

    def invoice_payment_failed(self, event_type: str, event: dict):
        self.invoice_service.save_invoice_payment(
            event_type=event_type, invoices_data=event
        )
        self.user_subscriptions_persistence.install_payment_status(
            customer_id=event["data"]["object"]["customer"],
            status=PaymentStatus.INACTIVE.value,
        )
        return "SUCCESS"

    def cancel_subscription(self, event: dict):
        self.user_subscriptions_persistence.install_payment_status(
            customer_id=event["data"]["object"]["customer"],
            status=PaymentStatus.CANCELED.value,
        )
        return "SUCCESS"
