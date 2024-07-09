import logging
import stripe
from config.stripe import StripeConfig
from schemas.users import UserSignUpForm

logger = logging.getLogger(__name__)
stripe.api_key = StripeConfig.api_key


def create_customer(user: UserSignUpForm):
    customer = stripe.Customer.create(
        email=user.email,
        description="User form web app signup form",
        name=f"{user.full_name}"
    )
    customer_id = customer.get("id")
    return customer_id
