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
            'id': pm.id,
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
            'status': 'SUCCESS',
            'message': 'Card successfully added'
        }
    except stripe.error.StripeError as e:
        return {
            'status': 'ERROR',
            'message': e.user_message
        }
        
def detach_card_from_customer(payment_method_id):
    try:
        stripe.PaymentMethod.detach(payment_method_id)
        return {
            'status': 'SUCCESS',
            'message': 'Card successfully removed'
        }
    except stripe.error.StripeError as e:
        return {
            'status': 'ERROR',
            'message': e.user_message
        }
        
def set_default_card_for_customer(customer_id, payment_method_id):
    try:
        stripe.Customer.modify(
            customer_id,
            invoice_settings={
                'default_payment_method': payment_method_id
            }
        )
        return {
            'status': 'SUCCESS',
            'message': 'Default card successfully set'
        }
    except stripe.error.StripeError as e:
        return {
            'status': 'ERROR',
            'message': e.user_message
        }
        
def determine_plan_name_from_product_id(product_id):
    product = stripe.Product.retrieve(product_id)
    return product.name


def save_payment_details_in_stripe(customer_id):
    try:
        payment_method_id = (
            stripe.PaymentMethod.list(
                customer=customer_id,
                type="card",
            )
            .data[0]
            .get("id")
        )

        stripe.Customer.modify(
            customer_id,
            invoice_settings={"default_payment_method": payment_method_id},
        )

        return True
    except Exception as e:
        return False
    
def get_billing_details_by_userid(customer_id):
    subscriptions = stripe.Subscription.list(
        customer=customer_id,
        limit=100 
    )
    
    if subscriptions.data:
        latest_subscription = max(subscriptions.data, key=lambda sub: sub.created)
        return latest_subscription
    else:
        return None

def purchase_product(customer_id, price_id, quantity):
    result = {
        'success': False
    }
    try:
        customer = stripe.Customer.retrieve(customer_id)
        default_payment_method_id = customer.invoice_settings.default_payment_method

        if not default_payment_method_id:
            result['error'] = "The customer doesn't have a default payment method."
            return result

        price = stripe.Price.retrieve(price_id)
        amount = price.unit_amount * quantity
        payment_intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=price.currency,
            customer=customer_id,
            payment_method=default_payment_method_id,
            confirm=True,
            automatic_payment_methods={
                'enabled': True,
                'allow_redirects': 'never'
            }
        )

        if payment_intent.status == 'succeeded':
            result['success'] = True
            return result
        else:
            result['error'] = (f"Unknown payment status: {payment_intent.status}")
            return payment_intent

    except Exception as e:
        result['error'] = (f"Mistake when buying an item: {e}")
        return result

    
def fetch_last_id_of_previous_page(customer_id, per_page, page):
    starting_after = None
    current_page = 1

    while current_page < page:
        invoices = stripe.Invoice.list(
            customer=customer_id,
            limit=per_page,
            starting_after=starting_after
        )
        if invoices.data:
            starting_after = invoices.data[-1].id
            current_page += 1
        else:
            return None

    return starting_after

        
def get_billing_history_by_userid(customer_id, page, per_page):
    import math
    starting_after = fetch_last_id_of_previous_page(customer_id, per_page, page) if page > 1 else None
    
    billing_history = stripe.Invoice.list(
        customer=customer_id,
        limit=per_page,
        starting_after=starting_after
    )
    
    if hasattr(billing_history, 'has_more'):
        has_more = billing_history.has_more
        count = billing_history.data and len(billing_history.data) or 0
        max_page = math.ceil(count / per_page) if per_page else 1
    else:
        count = len(billing_history.data)
        max_page = 1
    
    return billing_history.data, count, max_page
