import json
import logging

from fastapi import (
    APIRouter,
    Depends,
    Query,
    Request as fastRequest,
    HTTPException,
    status,
)
from typing import Literal

from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message_with_channel,
)
from db_dependencies import Db
from dependencies import (
    get_plans_service,
    get_payments_service,
    get_webhook,
    check_user_authentication,
    check_user_authorization_without_pixel,
    check_pixel_install_domain,
    AuthUser,
)
from enums import TeamAccessLevel
from models.users import Users
from models.users_domains import UserDomains
from persistence.leads_persistence import LeadsPersistence
from schemas.leads import ChargeCreditInfo
from schemas.subscriptions import UnsubscribeRequest
from services.payments import PaymentsService
from services.plans import PlansService
from services.subscriptions import SubscriptionService
from services.subscriptions.basic import BasicPlanService
from services.subscriptions.standard import StandardPlanService
from services.subscriptions.webhooks import SubscriptionWebhookService
from services.webhook import WebhookService

QUEUE_CREDITS_CHARGING = "credits_charging"
EMAIL_NOTIFICATIONS = "email_notifications"
router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/stripe-plans")
async def get_subscription_plans(
    plans_service: PlansService,
    user: Users = Depends(check_user_authentication),
):
    return plans_service.get_subscription_plans(user=user)


@router.get("/session/new")
async def create_customer_session(
    alias: str,
    payments_service: PaymentsService = Depends(get_payments_service),
    user: Users = Depends(check_user_authentication),
):
    if user.get("team_member"):
        team_member = user.get("team_member")
        if team_member.get("team_access_level") not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only.",
            )

    return await payments_service.create_customer_session(
        alias=alias, user=user
    )


@router.get("/basic-plan-upgrade")
async def test(
    user: AuthUser,
    basic_plan_service: BasicPlanService,
    plans_service: PlansService,
):
    customer_id = plans_service.get_customer_id(user)
    session_url = basic_plan_service.get_basic_plan_payment_url(
        customer_id=customer_id
    )
    return session_url


@router.get("/standard-plan-upgrade")
async def upgrade_to_standard(
    user: AuthUser,
    standard_plan_service: StandardPlanService,
    plans_service: PlansService,
    interval: Literal["month", "year"] = Query(...),
):
    customer_id = plans_service.get_customer_id(user)
    session_url = standard_plan_service.get_standard_plan_payment_url(
        customer_id=customer_id, interval=interval
    )
    return session_url


@router.post("/update-subscription-webhook")
async def update_subscription_webhook(
    request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)
):
    payload = await request.json()
    result_update_subscription = (
        webhook_service.update_subscription_confirmation(payload=payload)
    )
    user = result_update_subscription.get("user")
    if user:
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        queue_name = f"sse_events_{str(user.id)}"
        try:
            await publish_rabbitmq_message_with_channel(
                channel=channel,
                queue_name=queue_name,
                message_body={
                    "status": result_update_subscription.get("status"),
                    "update_subscription": True,
                },
            )
            await publish_rabbitmq_message_with_channel(
                channel=channel,
                queue_name=QUEUE_CREDITS_CHARGING,
                message_body={
                    "customer_id": user.customer_id,
                    "plan_id": result_update_subscription[
                        "contact_credit_plan_id"
                    ],
                },
            )
        except:
            logging.error("Failed to publish rabbitmq message")
        finally:
            await rabbitmq_connection.close()

    return "OK"


@router.post("/cancel-subscription-webhook")
async def cancel_subscription_webhook(
    request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)
):
    payload = await request.json()
    result_update_subscription = (
        webhook_service.cancel_subscription_confirmation(payload=payload)
    )
    if (
        result_update_subscription.get("status")
        and result_update_subscription["status"] == "failed"
    ):
        user = result_update_subscription["message_body"]["user"]
        queue_name = f"sse_events_{str(user.id)}"
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        try:
            message_text = (
                "It looks like your payment didn’t go through. Kindly check your payment card, go to - "
                "billing"
            )
            await publish_rabbitmq_message_with_channel(
                channel=channel,
                queue_name=queue_name,
                message_body={
                    "notification_text": message_text,
                    "notification_id": result_update_subscription[
                        "message_body"
                    ]["notification_id"],
                },
            )

            await publish_rabbitmq_message_with_channel(
                channel=channel,
                queue_name=EMAIL_NOTIFICATIONS,
                message_body={
                    "email": user.email,
                    "full_name": result_update_subscription["message_body"][
                        "full_name"
                    ],
                    "plan_name": result_update_subscription["message_body"][
                        "plan_name"
                    ],
                    "date": result_update_subscription["message_body"]["date"],
                    "invoice_number": result_update_subscription[
                        "message_body"
                    ]["invoice_number"],
                    "invoice_date": result_update_subscription["message_body"][
                        "invoice_date"
                    ],
                    "total": result_update_subscription["message_body"][
                        "total"
                    ],
                    "link": result_update_subscription["message_body"]["link"],
                },
            )

        except:
            await rabbitmq_connection.close()
        finally:
            await rabbitmq_connection.close()

    return "OK"


@router.post("/checkout-completed")
async def checkout_completed(
    request: fastRequest,
    db: Db,
    subscription_webhooks: SubscriptionWebhookService,
):
    event = await request.json()
    object_type = event["object"]

    if object_type != "event":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid object type",
        )

    event_type = event["type"]

    if event_type == "checkout.session.completed":
        event_session = event["data"]["object"]
        customer_id = event_session["customer"]
        subscription_id = event_session.get("subscription")

        metadata = event_session.get("metadata", {})

        checkout_type = metadata.get("type")

        if checkout_type == "upgrade_basic":
            subscription_webhooks.move_to_basic_plan(customer_id)
            db.commit()
            return "SUCCESS"
        elif checkout_type == "upgrade_standard":
            subscription_webhooks.move_to_standard_plan(
                customer_id, subscription_id
            )
            db.commit()
            return "SUCCESS"
        else:
            logger.warning(f"Unknown checkout type: {checkout_type}")

    logger.warning(f"Unknown event type: {event_type}")

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid object type"
    )


@router.post("/checkout-deleted")
async def checkout_deleted(
    request: fastRequest,
    subscription_webhooks: SubscriptionWebhookService,
):
    event = await request.json()
    object_type = event["object"]

    if object_type != "event":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid object type",
        )
    event_type = event["type"]
    if event_type == "customer.subscription.deleted":
        return subscription_webhooks.cancel_subscription(event)

    logger.warning(f"Unknown event type: {event_type}")

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid object type"
    )


@router.post("/update-payment")
async def update_payment(
    request: fastRequest,
    subscription_webhooks: SubscriptionWebhookService,
):
    event = await request.json()
    event_type = event["type"]
    match event_type:
        case "invoice.payment_succeeded":
            return subscription_webhooks.save_invoice_payment(
                event_type=event_type, event=event
            )

        case "invoice.payment_failed":
            return subscription_webhooks.invoice_payment_failed(
                event_type=event_type, event=event
            )
        case "charge.failed":
            return subscription_webhooks.invoice_payment_failed(
                event_type=event_type, event=event
            )
        case "payment_intent.succeeded":
            return subscription_webhooks.save_intent_payment(
                event_type=event_type, event=event
            )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid object type"
    )


@router.post("/update-payment-webhook")
async def update_payment_webhook(
    request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)
):
    payload = await request.json()
    result_update_subscription = webhook_service.create_payment_confirmation(
        payload=payload
    )
    return result_update_subscription


@router.post("/cancel-plan")
async def cancel_user_subscription(
    unsubscribe_request: UnsubscribeRequest,
    payments_service: PaymentsService = Depends(get_payments_service),
    user: dict = Depends(check_user_authorization_without_pixel),
):
    if user.get("team_member"):
        team_member = user.get("team_member")
        if team_member.get("team_access_level") not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only.",
            )

    return await payments_service.cancel_user_subscription(
        user=user, reason_unsubscribe=unsubscribe_request.reason_unsubscribe
    )


@router.get("/upgrade-and-downgrade-user-subscription")
async def upgrade_and_downgrade_user_subscription(
    alias: str,
    payments_service: PaymentsService = Depends(get_payments_service),
    user: dict = Depends(check_user_authentication),
):
    if user.get("team_member"):
        team_member = user.get("team_member")
        if team_member.get("team_access_level") not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only.",
            )

    return await payments_service.upgrade_and_downgrade_user_subscription(
        alias=alias, user=user
    )


@router.get("/cancel-downgrade")
def cancel_downgrade(
    payments_service: PaymentsService = Depends(get_payments_service),
    user: dict = Depends(check_user_authorization_without_pixel),
):
    if user.get("team_member"):
        team_member = user.get("team_member")
        if team_member.get("team_access_level") not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only.",
            )

    return payments_service.cancel_downgrade(user)


@router.get("/buy-credits")
def buy_credits(
    credits_used: int,
    payments_service: PaymentsService = Depends(get_payments_service),
    user: dict = Depends(check_user_authorization_without_pixel),
):
    if user.get("team_member"):
        team_member = user.get("team_member")
        if team_member.get("team_access_level") not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only.",
            )

    return payments_service.charge_user_for_extra_credits(credits_used, user)


@router.post("/shopify/billing/webhook", status_code=status.HTTP_200_OK)
async def shopify_billing_update_webhook(
    request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)
):
    payload = await request.json()
    result_update_subscription = (
        await webhook_service.shopify_billing_update_webhook(payload=payload)
    )
    if result_update_subscription.get("status"):
        user = result_update_subscription["user"]
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        try:
            await publish_rabbitmq_message_with_channel(
                channel=channel,
                queue_name=QUEUE_CREDITS_CHARGING,
                message_body={
                    "customer_id": user.customer_id,
                    "plan_id": result_update_subscription[
                        "contact_credit_plan_id"
                    ],
                },
            )
        except:
            logging.error("Failed to publish rabbitmq message")
        finally:
            await rabbitmq_connection.close()
    return "OK"


@router.get("/check-credit-status")
def get_status_credits(
    subscription_service: SubscriptionService,
    user: Users = Depends(check_user_authentication),
):
    return subscription_service.get_status_credits(user)


@router.put("/charge-credit")
def charge_credit(
    payload: ChargeCreditInfo,
    lead_persistence: LeadsPersistence,
    subscription_service: SubscriptionService,
    user: Users = Depends(check_user_authentication),
    domain: UserDomains = Depends(check_pixel_install_domain),
):
    return subscription_service.charge_credit(
        payload.five_x_five_id, user, lead_persistence, domain
    )
