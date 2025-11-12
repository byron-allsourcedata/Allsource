from datetime import datetime, timezone, timedelta
import time

try:
    from dateutil.relativedelta import relativedelta
except Exception:
    relativedelta = None
import math
import os
import uuid

import certifi
from typing import List, Optional

import stripe
import logging

from resolver import injectable
from services.stripe_service.schemas import NewStripeCustomer

os.environ["SSL_CERT_FILE"] = certifi.where()

from config.stripe import StripeConfig
from schemas.users import UserSignUpForm

stripe.api_key = StripeConfig.api_key

logging.getLogger("stripe").setLevel(logging.WARNING)
TRIAL_PERIOD_WITH_COUPON = 7


@injectable
class StripeService:
    def __init__(self):
        pass

    def get_stripe_account_info(self, stripe_account_id: str):
        try:
            account = stripe.Account.retrieve(stripe_account_id)
            return account
        except stripe.error.PermissionError as e:
            logging.error(f"Permission error: {e.user_message}")
            return None
        except stripe.error.InvalidRequestError as e:
            if e.code == "resource_missing":
                logging.error(f"Stripe account not found: {e.user_message}")
                return None
            else:
                logging.error(f"Invalid request error: {e.user_message}")
                return None
        except stripe.error.AuthenticationError as e:
            logging.error(f"Authentication error: {e.user_message}")
            return None

    def create_basic_plan_subscription(
        self, customer_id: str, stripe_price_id: str
    ):
        active_subs = stripe.Subscription.list(
            customer=customer_id, status="active"
        )
        active_count = len(active_subs["data"])
        if active_count >= 1:
            return None

        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": stripe_price_id}],
            collection_method="charge_automatically",
            billing_cycle_anchor_config={
                "day_of_month": 31,
                "hour": 16,
                "minute": 00,
            },
            off_session=True,
        )

        return subscription

    def create_standard_plan_subscription(
        self, customer_id: str, stripe_price_id: str
    ):
        active_subs = stripe.Subscription.list(
            customer=customer_id, status="active"
        )
        active_count = len(active_subs["data"])
        if active_count >= 1:
            return None

        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": stripe_price_id}],
            collection_method="charge_automatically",
            off_session=True,
        )

        return subscription

    @staticmethod
    def record_usage(customer_id: str, quantity: int):
        resp = stripe.billing.MeterEvent.create(
            event_name="contacts_resolutions",
            identifier=str(uuid.uuid4()),
            payload={
                "stripe_customer_id": customer_id,
                "value": quantity,
            },
        )
        return resp

    @staticmethod
    def create_stripe_transfer(amount: int, destination_account: str):
        transfer = stripe.Transfer.create(
            amount=int(amount * 100),
            currency="usd",
            destination=destination_account,
        )
        return transfer

    def create_checkout_session(
        self,
        customer_id: str,
        price_id: str,
        mode: str,
        metadata: dict = {},
        payment_intent_data: Optional[dict] = None,
        success_url: str = StripeConfig.success_url,
    ):
        params = {
            "success_url": success_url,
            "cancel_url": StripeConfig.cancel_url,
            "customer": customer_id,
            "payment_method_types": ["card"],
            "line_items": [{"price": price_id, "quantity": 1}],
            "mode": mode,
            "metadata": metadata,
        }

        if mode == "payment" and payment_intent_data:
            params["payment_intent_data"] = payment_intent_data

        session = stripe.checkout.Session.create(**params)

        return session.url

    def create_customer(self, user: NewStripeCustomer):
        return create_customer(user)

    def charge_customer_immediately(
        self,
        customer_id: str,
        amount_usd: int,
        currency: str,
        description: str,
        metadata: dict,
        payment_method_id: str,
    ) -> dict:
        result = {"success": False}
        try:
            payment_method = stripe.PaymentMethod.retrieve(payment_method_id)

            if payment_method.customer != customer_id:
                result["error"] = "Payment method does not belong to customer"
                return result

            payment_intent = stripe.PaymentIntent.create(
                amount=int(amount_usd * 100),
                currency=currency,
                customer=customer_id,
                payment_method=payment_method_id,
                confirm=True,
                off_session=True,
                automatic_payment_methods={
                    "enabled": True,
                    "allow_redirects": "never",
                },
                metadata=metadata,
                description=description,
            )

            if payment_intent.status == "succeeded":
                result["success"] = True
                result["stripe_payload"] = payment_intent
            else:
                result["error"] = f"Unexpected status: {payment_intent.status}"

        except Exception as e:
            result["error"] = f"Error while charging: {str(e)}"

        return result

    def create_shedule_payments(
        self,
        subscription_id: str,
        future_plan_price_id: str,
    ) -> dict:
        result = {"success": False}
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)

            items = subscription.get("items", {}).get("data", []) or []
            phase1_items = []
            if items:
                for itm in items:
                    price_id = itm.get("price", {}).get("id")
                    quantity = itm.get("quantity", 1)
                    if price_id:
                        phase1_items.append(
                            {"price": price_id, "quantity": quantity}
                        )
            else:
                result["error"] = (
                    "No items found in subscription, using current_plan_price_id"
                )

            def to_ts(val):
                if val is None:
                    return None
                # datetime
                if isinstance(val, datetime):
                    return int(val.timestamp())
                # int/float
                if isinstance(val, (int, float)):
                    return int(val)
                # string with digits or float-like
                if isinstance(val, str):
                    s = val.strip()
                    try:
                        return int(float(s))
                    except Exception:
                        return None
                return None

            cps = subscription.get("current_period_start") or subscription.get(
                "start_date"
            )
            eps = subscription.get("current_period_end") or subscription.get(
                "end_date"
            )

            start_ts = to_ts(cps) or int(time.time())
            end_ts = to_ts(eps) or int(time.time())

            if end_ts <= start_ts:
                end_ts = start_ts + 1

            phase1 = {
                "items": phase1_items,
                "start_date": start_ts,
                "end_date": end_ts,
            }

            phase2 = {
                "items": [{"price": future_plan_price_id, "quantity": 1}],
            }

            # schedule = stripe.SubscriptionSchedule.create(
            #     from_subscription=subscription_id,
            #     phases=[phase1, phase2],
            #     end_behavior="release",
            # )

            created = stripe.SubscriptionSchedule.create(
                from_subscription=subscription_id
            )

            schedule_id = created["id"]

            updated = stripe.SubscriptionSchedule.modify(
                schedule_id,
                phases=[phase1, phase2],
                end_behavior="release",
            )

            result["action"] = "created"
            result["updated"] = dict(updated)
            result["schedule_id"] = schedule_id
            result["success"] = True
        except Exception as e:
            result["error"] = f"Error while charging: {str(e)}"

        return result

    def create_pixel_plan_subscription_with_one_time_charge(
        self,
        customer_id: str,
        future_plan_price_id: str,
        trial_days: int = 14,
    ) -> dict:
        result = {"success": False}
        try:
            customer = stripe.Customer.retrieve(
                customer_id, expand=["invoice_settings.default_payment_method"]
            )
            default_pm = customer.get("invoice_settings", {}).get(
                "default_payment_method"
            )
            if not default_pm:
                pms = stripe.PaymentMethod.list(
                    customer=customer_id, type="card", limit=1
                )
                if pms and pms.get("data"):
                    default_pm = pms["data"][0]["id"]

            if not default_pm:
                result["error"] = (
                    "Customer has no saved payment method. Collect card via Checkout/Setup first."
                )
                return result

            trial_end_ts = int(time.time()) + int(trial_days) * 24 * 3600

            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": future_plan_price_id, "quantity": 1}],
                default_payment_method=default_pm,
                trial_end=trial_end_ts,
                collection_method="charge_automatically",
                expand=["latest_invoice.payment_intent"],
                metadata={"type": ""},
            )

            cps = subscription.get("current_period_start")
            cpe = subscription.get("current_period_end")
            plan_start = (
                datetime.fromtimestamp(int(cps), tz=timezone.utc)
                if cps
                else None
            )
            plan_end = (
                datetime.fromtimestamp(int(cpe), tz=timezone.utc)
                if cpe
                else datetime.fromtimestamp(trial_end_ts, tz=timezone.utc)
            )

            result["success"] = True
            result["subscription"] = dict(subscription)
            result["subscription_id"] = subscription.get("id")
            result["plan_start"] = plan_start
            result["plan_end"] = plan_end
            return result

        except Exception as e:
            result["error"] = str(e)
            return result

    def get_subscription_info(self, subscription_id: str):
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)

            cps = subscription.get("current_period_start")
            cpe = subscription.get("current_period_end")

            items = subscription.get("items", {}).get("data", []) or []
            item0 = items[0] if items else None
            if not cps and item0:
                cps = item0.get("current_period_start") or item0.get(
                    "current_period_start"
                )
            if not cpe and item0:
                cpe = item0.get("current_period_end") or item0.get(
                    "current_period_end"
                )

            if (not cps or not cpe) and subscription.get("latest_invoice"):
                try:
                    invoice = stripe.Invoice.retrieve(
                        subscription["latest_invoice"]
                    )
                    lines = invoice.get("lines", {}).get("data", []) or []
                    if lines:
                        period = lines[0].get("period", {}) or {}
                        cps = cps or period.get("start")
                        cpe = cpe or period.get("end")
                except Exception as e:
                    logging.getLogger(__name__).warning(
                        "Failed to retrieve invoice %s for subscription %s: %s",
                        subscription.get("latest_invoice"),
                        subscription_id,
                        str(e),
                    )

            if (
                (not cps or not cpe)
                and subscription.get("start_date")
                and item0
            ):
                try:
                    cps = cps or subscription.get("start_date")
                    recurring = (
                        item0.get("price", {}).get("recurring", {})
                        if item0
                        else {}
                    )
                    interval = recurring.get("interval")
                    interval_count = recurring.get("interval_count") or 1

                    if interval == "month":
                        start_dt = datetime.fromtimestamp(
                            int(cps), tz=timezone.utc
                        )
                        if relativedelta:
                            end_dt = start_dt + relativedelta(
                                months=int(interval_count)
                            )
                        else:
                            end_dt = start_dt + timedelta(
                                days=30 * int(interval_count)
                            )
                        cpe = cpe or int(end_dt.timestamp())
                    elif interval == "year":
                        start_dt = datetime.fromtimestamp(
                            int(cps), tz=timezone.utc
                        )
                        if relativedelta:
                            end_dt = start_dt + relativedelta(
                                years=int(interval_count)
                            )
                        else:
                            end_dt = start_dt + timedelta(
                                days=365 * int(interval_count)
                            )
                        cpe = cpe or int(end_dt.timestamp())
                except Exception:
                    pass

            plan_start = (
                datetime.fromtimestamp(int(cps), tz=timezone.utc)
                if cps
                else None
            )
            plan_end = (
                datetime.fromtimestamp(int(cpe), tz=timezone.utc)
                if cpe
                else None
            )

            price_id = None
            if item0:
                price_id = item0.get("price", {}).get("id") or item0.get(
                    "plan", {}
                ).get("id")
            else:
                price_id = subscription.get("plan", {}).get(
                    "id"
                ) or subscription.get("items", {}).get("data", [{}])[0].get(
                    "price", {}
                ).get("id")

            info = {
                "subscription_id": subscription.get("id"),
                "customer_id": subscription.get("customer"),
                "status": subscription.get("status"),
                "plan_start": plan_start,
                "plan_end": plan_end,
                "cancel_at_period_end": subscription.get(
                    "cancel_at_period_end"
                ),
                "price_id": price_id,
                "raw_subscription": dict(subscription),
            }

            return {"status": "SUCCESS", "data": info}

        except stripe.error.InvalidRequestError as e:
            return {
                "status": "ERROR",
                "message": f"Invalid request: {e.user_message}",
            }
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}


def create_customer(user: NewStripeCustomer):
    customer = stripe.Customer.create(
        email=user.email,
        description="User form web app signup form",
        name=f"{user.full_name}",
    )
    customer_id = customer.get("id")
    return customer_id


def get_default_payment_method(customer_id):
    customer = stripe.Customer.retrieve(customer_id)
    default_payment_method_id = customer.invoice_settings.get(
        "default_payment_method"
    )
    return default_payment_method_id


def renew_subscription(new_price_id, customer_id):
    new_subscription = stripe.Subscription.create(
        customer=customer_id, items=[{"price": new_price_id}]
    )
    if new_subscription.status == "trialing":
        return "active"
    return new_subscription.status


def create_customer_google(user: dict):
    customer = stripe.Customer.create(
        email=user.get("email"),
        description="User form web app signup form",
        name=user.get("full_name"),
    )
    customer_id = customer.get("id")
    return customer_id


def get_card_details_by_customer_id(customer_id):
    customer = stripe.Customer.retrieve(customer_id)
    payment_methods = stripe.PaymentMethod.list(
        customer=customer_id, type="card"
    )

    card_details = []

    default_payment_method_id = customer.invoice_settings.get(
        "default_payment_method"
    )

    for pm in payment_methods.auto_paging_iter():
        card_info = {
            "id": pm.id,
            "last4": pm.card.last4,
            "brand": pm.card.brand,
            "exp_month": pm.card.exp_month,
            "exp_year": pm.card.exp_year,
            "is_default": pm.id == default_payment_method_id,
        }
        card_details.append(card_info)

    return card_details


def add_card_to_customer(customer_id, payment_method_id, is_default: bool):
    try:
        new_pm = stripe.PaymentMethod.retrieve(payment_method_id)
        new_fingerprint = new_pm.card.fingerprint

        existing_methods = stripe.PaymentMethod.list(
            customer=customer_id, type="card"
        ).data

        for method in existing_methods:
            if method.card.fingerprint == new_fingerprint:
                return {
                    "status": "ERROR",
                    "message": "This card has already been added!",
                }

        payment_method = stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id,
        )
        if is_default:
            stripe.Customer.modify(
                customer_id,
                invoice_settings={"default_payment_method": payment_method_id},
            )
        return {
            "status": "SUCCESS",
            "card_details": {
                "id": payment_method.id,
                "last4": payment_method.card.last4,
                "brand": payment_method.card.brand,
                "exp_month": payment_method.card.exp_month,
                "exp_year": payment_method.card.exp_year,
                "is_default": is_default,
            },
        }
    except stripe.error.StripeError as e:
        return {"status": "ERROR", "message": e.user_message}


def get_billing_by_invoice_id(invoice_id):
    try:
        invoice = stripe.Invoice.retrieve(invoice_id)
        return {"status": "SUCCESS", "data": invoice}
    except stripe.error.InvalidRequestError as e:
        return {"status": "ERROR", "message": "Invalid request: " + str(e)}
    except stripe.error.AuthenticationError as e:
        return {"status": "ERROR", "message": "Authentication error: " + str(e)}
    except stripe.error.RateLimitError as e:
        return {"status": "ERROR", "message": "Rate limit exceeded: " + str(e)}
    except stripe.error.APIError as e:
        return {"status": "ERROR", "message": "Stripe API error: " + str(e)}
    except Exception as e:
        return {
            "status": "ERROR",
            "message": "An unexpected error occurred: " + str(e),
        }


def get_billing_by_charge_id(invoice_id):
    try:
        invoice = stripe.Charge.retrieve(invoice_id)
        return {"status": "SUCCESS", "data": invoice}
    except stripe.error.InvalidRequestError as e:
        return {"status": "ERROR", "message": "Invalid request: " + str(e)}
    except stripe.error.AuthenticationError as e:
        return {"status": "ERROR", "message": "Authentication error: " + str(e)}
    except stripe.error.RateLimitError as e:
        return {"status": "ERROR", "message": "Rate limit exceeded: " + str(e)}
    except stripe.error.APIError as e:
        return {"status": "ERROR", "message": "Stripe API error: " + str(e)}
    except Exception as e:
        return {
            "status": "ERROR",
            "message": "An unexpected error occurred: " + str(e),
        }


def detach_card_from_customer(payment_method_id):
    try:
        stripe.PaymentMethod.detach(payment_method_id)
        return {"status": "SUCCESS", "message": "Card successfully removed"}
    except stripe.error.StripeError as e:
        return {"status": "ERROR", "message": e.user_message}


def set_default_card_for_customer(customer_id, payment_method_id):
    try:
        stripe.Customer.modify(
            customer_id,
            invoice_settings={"default_payment_method": payment_method_id},
        )
        return {"status": "SUCCESS", "message": "Default card successfully set"}
    except stripe.error.StripeError as e:
        return {"status": "ERROR", "message": e.user_message}


def determine_plan_name_from_product_id(product_id):
    product = stripe.Product.retrieve(product_id)
    return product.name


def cancel_subscription_at_period_end(subscription_id):
    subscription = stripe.Subscription.retrieve(subscription_id)
    if subscription["schedule"]:
        subscription_schedule_id = subscription["schedule"]
        schedule = stripe.SubscriptionSchedule.retrieve(
            subscription_schedule_id
        )
        stripe.SubscriptionSchedule.release(schedule.id)
    return stripe.Subscription.modify(
        subscription_id, cancel_at_period_end=True
    )


def cancel_downgrade(platform_subscription_id):
    current_subscription = stripe.Subscription.retrieve(
        platform_subscription_id
    )
    if current_subscription.get("schedule"):
        subscription_schedule_id = current_subscription["schedule"]
        schedule = stripe.SubscriptionSchedule.retrieve(
            subscription_schedule_id
        )
        stripe.SubscriptionSchedule.release(schedule.id)
        return "SUCCESS"


def save_payment_details_in_stripe(customer_id: str):
    try:
        methods = stripe.PaymentMethod.list(
            customer=customer_id, type="card"
        ).data

        if not methods:
            return False

        fingerprint_map = {}
        for method in methods:
            fp = method.card.fingerprint
            if fp in fingerprint_map:
                fingerprint_map[fp].append(method)
            else:
                fingerprint_map[fp] = [method]

        for same_fp_cards in fingerprint_map.values():
            if len(same_fp_cards) > 1:
                for duplicate_card in same_fp_cards[1:]:
                    stripe.PaymentMethod.detach(duplicate_card.id)

        remaining_methods = stripe.PaymentMethod.list(
            customer=customer_id, type="card"
        ).data

        if remaining_methods:
            stripe.Customer.modify(
                customer_id,
                invoice_settings={
                    "default_payment_method": remaining_methods[0].id
                },
            )

        return True

    except Exception as e:
        return False


def get_billing_details_by_userid(customer_id):
    subscriptions = stripe.Subscription.list(customer=customer_id, limit=100)

    if subscriptions.data:
        latest_subscription = max(
            subscriptions.data, key=lambda sub: sub.created
        )
        return latest_subscription
    else:
        return None


def get_product_from_price_id(price_id):
    price = stripe.Price.retrieve(price_id)
    product = stripe.Product.retrieve(price.product)
    return product


def get_price_from_price_id(price_id):
    return stripe.Price.retrieve(price_id)


def get_last_payment_intent(customer_id):
    params = {
        "limit": 1,
    }
    if customer_id:
        params["customer"] = customer_id

    intents = stripe.PaymentIntent.list(**params)

    if intents.data:
        return intents.data[0]
    return None


def purchase_product(
    customer_id,
    price_id,
    quantity,
    product_description,
    charge_type,
    payment_method_id: Optional[str] = None,
):
    result = {"success": False}
    try:
        if payment_method_id:
            payment_method = stripe.PaymentMethod.retrieve(payment_method_id)

            if payment_method.customer != customer_id:
                result["error"] = "Payment method does not belong to customer"
                return result

        else:
            customer = stripe.Customer.retrieve(customer_id)
            payment_method_id = customer.invoice_settings.default_payment_method

            if not payment_method_id:
                result["error"] = (
                    "The customer doesn't have a default payment method."
                )
                return result

        price = stripe.Price.retrieve(price_id)
        amount = price.unit_amount * quantity
        payment_intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=price.currency,
            customer=customer_id,
            payment_method=payment_method_id,
            confirm=True,
            automatic_payment_methods={
                "enabled": True,
                "allow_redirects": "never",
            },
            metadata={
                "charge_type": charge_type,
                "quantity": quantity,
            },
            description=f"Purchase of {quantity} x {product_description}",
        )
        if payment_intent.status == "succeeded":
            result["success"] = True
            result["stripe_payload"] = payment_intent
            return result
        else:
            result["error"] = f"Unknown payment status: {payment_intent.status}"
            return payment_intent

    except Exception as e:
        result["error"] = f"Mistake when buying an item: {e}"
        return result


def fetch_last_id_of_previous_page(customer_id, per_page, page):
    starting_after = None
    current_page = 1

    while current_page < page:
        invoices = stripe.Invoice.list(
            customer=customer_id, limit=per_page, starting_after=starting_after
        )
        if invoices.data:
            starting_after = invoices.data[-1].id
            current_page += 1
        else:
            return None

    return starting_after


def get_stripe_payment_url(customer_id, stripe_payment_hash):
    stripe_payment_url = create_stripe_checkout_session(
        customer_id=customer_id,
        line_items=[
            {"price": stripe_payment_hash["stripe_price_id"], "quantity": 1}
        ],
        mode="subscription",
        coupon=stripe_payment_hash["coupon"],
        trial_period=stripe_payment_hash.get("trial_period", 0),
    )
    return stripe_payment_url.get("link")


def create_stripe_checkout_session(
    customer_id: str,
    line_items: List[dict],
    mode: str,
    trial_period: int = 0,
    coupon: str = None,
):
    if trial_period > 0:
        if coupon:
            trial_period = TRIAL_PERIOD_WITH_COUPON
        subscription_data = {"trial_period_days": trial_period}
    else:
        subscription_data = {"trial_period_days": None}

    discounts = [{"coupon": coupon}] if coupon else None

    try:
        session = stripe.checkout.Session.create(
            success_url=StripeConfig.success_url,
            cancel_url=StripeConfig.cancel_url,
            customer=customer_id,
            payment_method_types=["card"],
            line_items=line_items,
            mode=mode,
            subscription_data=subscription_data,
            discounts=discounts,
        )
    except stripe.error.InvalidRequestError as e:
        if "Coupon" in str(e) and "is expired" in str(e):
            session = stripe.checkout.Session.create(
                success_url=StripeConfig.success_url,
                cancel_url=StripeConfig.cancel_url,
                customer=customer_id,
                payment_method_types=["card"],
                line_items=line_items,
                mode=mode,
                subscription_data=subscription_data,
                discounts=None,
            )
        else:
            raise

    return {"link": session.url}


def get_billing_history_by_userid(customer_id, page, per_page):
    billing_history = []

    invoices = stripe.Invoice.list(customer=customer_id, limit=per_page)
    for invoice in invoices.data:
        if invoice.amount_due > 0:
            billing_history.append(invoice)

    charges = stripe.Charge.list(customer=customer_id, limit=per_page).data
    for charge in charges:
        charge_type = getattr(charge, "metadata", {}).get("charge_type", "")
        if charge_type in {
            "contacts_overage",
            "buy_funds",
            "buy_premium_source",
        }:
            billing_history.append(charge)

    count = len(billing_history)
    max_page = math.ceil(count / per_page)
    start = (page - 1) * per_page
    end = min(page * per_page, count)
    return billing_history[start:end], count, max_page
