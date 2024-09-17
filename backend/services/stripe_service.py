import logging
import stripe
from config.stripe import StripeConfig
from schemas.users import UserSignUpForm

stripe.api_key = StripeConfig.api_key


def create_customer(user: UserSignUpForm):
    customer = stripe.Customer.create(
        email=user.email,
        description="User form web app signup form",
        name=f"{user.full_name}"
    )
    customer_id = customer.get("id")
    return customer_id


def create_customer_google(user: dict):
    customer = stripe.Customer.create(
        email=user.get("email"),
        description="User form web app signup form",
        name=user.get("full_name")
    )
    customer_id = customer.get("id")
    return customer_id

def get_card_details_by_customer_id(customer_id):
    payment_methods = stripe.PaymentMethod.list(
        customer=customer_id,
        type='card'
    )
    card_details = []
    for pm in payment_methods.auto_paging_iter():
        card_info = {
            'last4': pm.card.last4,
            'brand': pm.card.brand,
            'exp_month': pm.card.exp_month,
            'exp_year': pm.card.exp_year
        }
        card_details.append(card_info)
    return card_details

def add_card_to_customer(customer_id, payment_method_id):
    try:
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id
        )
        
        return {
            'status': 'success',
            'message': 'Card successfully added'
        }
    except stripe.error.StripeError as e:
        return {
            'status': 'error',
            'message': e.user_message
        }
        
def get_billing_history_by_userid(self, user, page, per_page):
    # offset = (page - 1) * per_page
    # leads = query.limit(per_page).offset(offset).all()
    # count = query.count()
    # max_page = math.ceil(count / per_page)
    # return leads, count, max_page
    print(1)
