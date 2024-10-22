import logging

import pandas as pd
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


def get_default_payment_method(customer_id):
    customer = stripe.Customer.retrieve(customer_id)
    default_payment_method_id = customer.invoice_settings.get('default_payment_method')
    return default_payment_method_id


def renew_subscription(new_price_id, customer_id):
    new_subscription = stripe.Subscription.create(
        customer=customer_id,
        items=[{"price": new_price_id}],
    )

    return new_subscription


def create_customer_google(user: dict):
    customer = stripe.Customer.create(
        email=user.get("email"),
        description="User form web app signup form",
        name=user.get("full_name")
    )
    customer_id = customer.get("id")
    return customer_id


def get_card_details_by_customer_id(customer_id):
    customer = stripe.Customer.retrieve(customer_id)
    payment_methods = stripe.PaymentMethod.list(
        customer=customer_id,
        type='card'
    )

    card_details = []

    default_payment_method_id = customer.invoice_settings.get('default_payment_method')

    for pm in payment_methods.auto_paging_iter():
        card_info = {
            'id': pm.id,
            'last4': pm.card.last4,
            'brand': pm.card.brand,
            'exp_month': pm.card.exp_month,
            'exp_year': pm.card.exp_year,
            'is_default': pm.id == default_payment_method_id
        }
        card_details.append(card_info)

    return card_details


def add_card_to_customer(customer_id, payment_method_id):
    try:
        payment_method = stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id
        )
        return {
            'status': 'SUCCESS',
            'card_details': {
                'id': payment_method.id,
                'last4': payment_method.card.last4,
                'brand': payment_method.card.brand,
                'exp_month': payment_method.card.exp_month,
                'exp_year': payment_method.card.exp_year,
                'is_default': False
            }
        }
    except stripe.error.StripeError as e:
        return {
            'status': 'ERROR',
            'message': e.user_message
        }


def get_billing_by_invoice_id(invoice_id):
    try:
        invoice = stripe.Invoice.retrieve(invoice_id)
        return {
            'status': 'SUCCESS',
            'data': invoice
        }
    except stripe.error.InvalidRequestError as e:
        return {
            'status': 'ERROR',
            'message': 'Invalid request: ' + str(e)
        }
    except stripe.error.AuthenticationError as e:
        return {
            'status': 'ERROR',
            'message': 'Authentication error: ' + str(e)
        }
    except stripe.error.RateLimitError as e:
        return {
            'status': 'ERROR',
            'message': 'Rate limit exceeded: ' + str(e)
        }
    except stripe.error.APIError as e:
        return {
            'status': 'ERROR',
            'message': 'Stripe API error: ' + str(e)
        }
    except Exception as e:
        return {
            'status': 'ERROR',
            'message': 'An unexpected error occurred: ' + str(e)
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


def cancel_subscription_at_period_end(subscription_id):
    subscription = stripe.Subscription.retrieve(subscription_id)
    if subscription['schedule']:
        subscription_schedule_id = subscription['schedule']
        schedule = stripe.SubscriptionSchedule.retrieve(subscription_schedule_id)
        stripe.SubscriptionSchedule.release(schedule.id)
    return stripe.Subscription.modify(
        subscription_id,
        cancel_at_period_end=True
    )


def cancel_downgrade(platform_subscription_id):
    current_subscription = stripe.Subscription.retrieve(platform_subscription_id)
    if current_subscription.get("schedule"):
        subscription_schedule_id = current_subscription['schedule']
        schedule = stripe.SubscriptionSchedule.retrieve(subscription_schedule_id)
        stripe.SubscriptionSchedule.release(schedule.id)
        return 'SUCCESS'


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


def get_product_from_price_id(price_id):
    price = stripe.Price.retrieve(price_id)
    product = stripe.Product.retrieve(price.product)
    return product


def get_price_from_price_id(price_id):
    return stripe.Price.retrieve(price_id)


def purchase_product(customer_id, price_id, quantity, product_description):
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
            },
            metadata={
                'product_description': product_description,
                'quantity': quantity
            },
            description=f"Purchase of {quantity} x {product_description}"
        )
        if payment_intent.status == 'succeeded':
            result['success'] = True
            result['stripe_payload'] = payment_intent
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

    billing_history_invoices = stripe.Invoice.list(
        customer=customer_id,
        limit=per_page,
        starting_after=starting_after
    )

    billing_history_charges = stripe.Charge.list(
        customer=customer_id,
        limit=per_page,
        starting_after=starting_after
    )

    non_subscription_charges = [
        charge for charge in billing_history_charges.data if charge.invoice is None
    ]

    limit = min(len(billing_history_invoices.data), per_page)

    billing_history = (billing_history_invoices.data[:limit] + non_subscription_charges)[
                      :min(limit + len(non_subscription_charges), per_page)]

    count = len(billing_history)
    max_page = math.ceil(count / per_page) if per_page else 1
    has_more = billing_history_invoices.has_more or (
            billing_history_charges.has_more and len(non_subscription_charges) < per_page)

    return billing_history, count, max_page, has_more
