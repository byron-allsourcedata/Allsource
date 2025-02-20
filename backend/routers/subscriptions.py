import logging

from fastapi import APIRouter, Depends, Query, Request as fastRequest, HTTPException, status, Response

from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from dependencies import get_plans_service, get_payments_service, get_webhook, check_user_authentication, \
    check_user_authorization_without_pixel, get_subscription_service, get_users_service
from enums import TeamAccessLevel
from models.users import Users
from schemas.subscriptions import UnsubscribeRequest
from schemas.leads import ChargeCreditInfo
from services.payments import PaymentsService
from services.users import UsersService
from services.plans import PlansService
from services.subscriptions import SubscriptionService
from services.webhook import WebhookService

QUEUE_CREDITS_CHARGING = 'credits_charging'
EMAIL_NOTIFICATIONS = 'email_notifications'
router = APIRouter()


@router.get("/stripe-plans")
async def get_subscription_plans(plans_service: PlansService = Depends(get_plans_service),
                                 user: Users = Depends(check_user_authentication)):
    return plans_service.get_subscription_plans(user=user)


@router.get("/session/new")
async def create_customer_session(price_id: str, payments_service: PaymentsService = Depends(get_payments_service),
                                  user: Users = Depends(check_user_authentication)):
    
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only."
            )
            
    return payments_service.create_customer_session(price_id=price_id, user=user)


@router.post("/update-subscription-webhook")
async def update_payment_confirmation(request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)):
    payload = await request.json()
    result_update_subscription = webhook_service.update_subscription_confirmation(payload=payload)
    user = result_update_subscription.get('user')
    if user:
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        queue_name = f"sse_events_{str(user.id)}"
        try:
            await publish_rabbitmq_message(
            connection=connection,
            queue_name=queue_name,
            message_body={'status': result_update_subscription.get('status'),
                        'update_subscription': True}
            )
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=QUEUE_CREDITS_CHARGING,
                message_body={
                    'customer_id': user.customer_id,
                    'plan_id': result_update_subscription['lead_credit_plan_id']
                }
            )
        except:
            logging.error('Failed to publish rabbitmq message')
        finally:
            await rabbitmq_connection.close()
            
    return "OK"


@router.post("/cancel-subscription-webhook")
async def update_payment_confirmation(request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)):
    payload = await request.json()        
    result_update_subscription = webhook_service.cancel_subscription_confirmation(payload=payload)
    if result_update_subscription.get('status') and result_update_subscription['status'] == 'failed':
        user = result_update_subscription['message_body']['user']
        queue_name = f'sse_events_{str(user.id)}'
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        try:
            message_text = ('It looks like your payment didn’t go through. Kindly check your payment card, go to - '
                            'billing')
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body={'notification_text': message_text,
                              'notification_id': result_update_subscription['message_body']['notification_id']}
            )

            await publish_rabbitmq_message(
                connection=connection,
                queue_name=EMAIL_NOTIFICATIONS,
                message_body={
                    'email': user.email,
                    'full_name': result_update_subscription['message_body']['full_name'],
                    'plan_name': result_update_subscription['message_body']['plan_name'],
                    'date': result_update_subscription['message_body']['date'],
                    'invoice_number': result_update_subscription['message_body']['invoice_number'],
                    'invoice_date': result_update_subscription['message_body']['invoice_date'],
                    'total': result_update_subscription['message_body']['total'],
                    'link': result_update_subscription['message_body']['link']
                }
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
    return result_update_subscription


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
            
    return payments_service.cancel_user_subscription(user=user,
                                                     reason_unsubscribe=unsubscribe_request.reason_unsubscribe)


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


@router.post("/shopify/billing/webhook", status_code=status.HTTP_200_OK)
async def shopify_billing_update_webhook(request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)):
    payload = await request.json()
    result_update_subscription = webhook_service.shopify_billing_update_webhook(payload=payload)
    if result_update_subscription.get('status'):
        user = result_update_subscription['user']
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        try:
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=QUEUE_CREDITS_CHARGING,
                message_body={
                    'customer_id': user.customer_id,
                    'plan_id': result_update_subscription['lead_credit_plan_id']
                }
            )
        except:
            logging.error('Failed to publish rabbitmq message')
        finally:
            await rabbitmq_connection.close()
    return "OK"


@router.get("/check-credit-status")
def get_status_credits(subscription_service: SubscriptionService = Depends(get_subscription_service), 
                             user: Users = Depends(check_user_authentication)):
    return subscription_service.get_status_credits(user)


@router.put("/charge-credit")
def charge_credit(
        payload: ChargeCreditInfo,
        users_service: UsersService = Depends(get_users_service)):
    return users_service.charge_credit(payload.five_x_five_id)