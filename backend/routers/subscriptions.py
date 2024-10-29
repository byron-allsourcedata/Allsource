from fastapi import APIRouter, Depends, Request as fastRequest, HTTPException, status

from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from dependencies import get_plans_service, get_payments_service, get_webhook, check_user_authentication, \
    check_user_authorization_without_pixel
from enums import TeamAccessLevel
from models.users import Users
from schemas.subscriptions import UnsubscribeRequest
from services.payments import PaymentsService
from services.plans import PlansService
from services.webhook import WebhookService


QUEUE_CREDITS_CHARGING = 'credits_charging'

router = APIRouter()


@router.get("/stripe-plans")
async def get_subscription_plans(plans_service: PlansService = Depends(get_plans_service),
                                 user: Users = Depends(check_user_authentication)):
    return plans_service.get_subscription_plans(user=user)


@router.get("/session/new")
async def create_customer_session(price_id: str, payments_service: PaymentsService = Depends(get_payments_service),
                                  user: Users = Depends(check_user_authentication)):

    return payments_service.create_customer_session(price_id=price_id, user=user)


@router.post("/update-subscription-webhook")
async def update_payment_confirmation(request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)):
    payload = await request.json()
    result_update_subscription = webhook_service.update_subscription_confirmation(payload=payload)
    if result_update_subscription['status']:
        user = result_update_subscription['user']
        queue_name = f'sse_events_{str(user.id)}'
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        try:
            message_text = None
            if result_update_subscription['status'] == 'active':
                message_text = 'Update subscription success'
            elif result_update_subscription['status'] == 'inactive':
                message_text = 'It looks like your payment didn’t go through. Kindly check your payment card, go to - billing'
            elif result_update_subscription['status'] == 'canceled':
                message_text = 'Update subscription failed'
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body={'notification_text': message_text}
            )
        except:
            await rabbitmq_connection.close()
        finally:
            await rabbitmq_connection.close()

        try:
            await publish_rabbitmq_message(
                connection=rabbitmq_connection,
                queue_name=QUEUE_CREDITS_CHARGING,
                message_body={
                    'customer_id': user.customer_id,
                    'plan_id': result_update_subscription['lead_credit_plan_id']
                }
            )
        except:
            await rabbitmq_connection.close()
        finally:
            await rabbitmq_connection.close()

    return "OK"


@router.post("/cancel-subscription-webhook")
async def update_payment_confirmation(request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)):
    payload = await request.json()
    result_update_subscription = webhook_service.cancel_subscription_confirmation(payload=payload)
    if result_update_subscription['status']:
        user = result_update_subscription['user']
        queue_name = f'sse_events_{str(user.id)}'
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        try:
            message_text = None
            if result_update_subscription['status'] == 'active':
                message_text = 'Update subscription success'
            elif result_update_subscription['status'] == 'inactive':
                message_text = 'It looks like your payment didn’t go through. Kindly check your payment card, go to - billing'
            elif result_update_subscription['status'] == 'canceled':
                message_text = 'Update subscription failed'
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body={'notification_text': message_text}
            )
        except:
            await rabbitmq_connection.close()
        finally:
            await rabbitmq_connection.close()

    return "OK"

@router.post("/update-payment-webhook")
async def update_payment_confirmation(request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)):
    payload = await request.json()
    result_update_subscription = webhook_service.create_payment_confirmation(payload=payload)
    if result_update_subscription['status']:
        user = result_update_subscription['user']
        queue_name = f'sse_events_{str(user.id)}'
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        try:
            if result_update_subscription['status'] == 'succeeded':
                message_text = 'Payment contacts succeeded'
            else:
                message_text = 'It looks like your payment didn’t go through. Kindly check your payment card, go to - billing'
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body={'notification_text': message_text}
            )
        except:
            await rabbitmq_connection.close()
        finally:
            await rabbitmq_connection.close()

    return


@router.post("/cancel-plan")
def cancel_user_subscription(unsubscribe_request: UnsubscribeRequest,
                             payments_service: PaymentsService = Depends(get_payments_service),
                             user: dict = Depends(check_user_authorization_without_pixel)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )

    return payments_service.cancel_user_subscription(user=user, reason_unsubscribe=unsubscribe_request.reason_unsubscribe)


@router.get("/upgrade-and-downgrade-user-subscription")
def upgrade_and_downgrade_user_subscription(price_id: str,
                                            payments_service: PaymentsService = Depends(get_payments_service),
                                            user: dict = Depends(check_user_authentication)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )

    return payments_service.upgrade_and_downgrade_user_subscription(price_id=price_id, user=user)


@router.get("/cancel-downgrade")
def cancel_downgrade(payments_service: PaymentsService = Depends(get_payments_service),
                     user: dict = Depends(check_user_authorization_without_pixel)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )

    return payments_service.cancel_downgrade(user)


@router.get("/buy-credits")
def buy_credits(credits_used: int, payments_service: PaymentsService = Depends(get_payments_service),
                user: dict = Depends(check_user_authorization_without_pixel)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )

    return payments_service.charge_user_for_extra_credits(credits_used, user)
