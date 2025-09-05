from uuid import UUID
from domains.users.service import UsersService
from resolver import injectable
from services.stripe_service import StripeService


@injectable
class PremiumSourceStripeService:
    def __init__(self, users: UsersService, stripe_service: StripeService):
        self.stripe_service = stripe_service
        self.users = users

    def charge_customer_immediately(
        self,
        user_id: int,
        premium_source_id: UUID,
        payment_method_id: str,
        amount_cents: int,
    ):
        customer_id = self.users.stripe_customer_id_by_id(user_id)
        result = self.stripe_service.charge_customer_immediately(
            customer_id=customer_id,
            amount_usd=float(amount_cents) / 100.0,
            currency="usd",
            description="Premium source payment",
            metadata={
                "user_id": str(user_id),
                "premium_source_id": str(premium_source_id),
                "amount_usd": float(amount_cents) / 100.0,
                "charge_type": "buy_premium_source",
            },
            payment_method_id=payment_method_id,
        )

        if result["success"]:
            event = result["stripe_payload"]
            return

        raise Exception(result["error"])
