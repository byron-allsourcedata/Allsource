from fastapi import APIRouter, Depends, Request as fastRequest

from dependencies import get_plans_service, get_payments_service, get_webhook
from enums import UserAuthorizationStatus
from services.plans import PlansService
from services.webhook import WebhookService
from services.payments import PaymentsService

router = APIRouter()


@router.get("/stripe-plans")
async def get_subscription_plans(plans_service: PlansService = Depends(get_plans_service)):
    status = plans_service.get_user_subscription_authorization_status()
    if status != UserAuthorizationStatus.SUCCESS:
        return status
    return plans_service.get_subscription_plans()


@router.get("/session/new")
async def create_customer_session(price_id: str, payments_service: PaymentsService = Depends(get_payments_service)):
    status = payments_service.get_user_subscription_authorization_status()
    if status != UserAuthorizationStatus.SUCCESS:
        return status
    return payments_service.create_customer_session(price_id)


@router.post("/update-subscription-webhook")
async def update_payment_confirmation(request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)):
    payload = await request.json()
    return webhook_service.update_subscription_confirmation(payload)

@router.post("/cancel-subscription-webhook")
async def update_payment_confirmation(request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)):
    payload = await request.json()
    return webhook_service.cancel_subscription_confirmation(payload)

@router.post("/update-payment-webhook")
async def update_payment_confirmation(request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)):
    payload = await request.json()
    return webhook_service.create_payment_confirmation(payload)


@router.post("/cancel-plan")
def cancel_user_subscripion(payments_service: PaymentsService = Depends(get_payments_service)):
    status = payments_service.get_user_subscription_authorization_status()
    if status != UserAuthorizationStatus.SUCCESS:
        return status
    return payments_service.cancel_user_subscripion()

@router.get("/upgrade-and-downgrade-user-subscription")
def cancel_user_subscripion(price_id: str, payments_service: PaymentsService = Depends(get_payments_service)):
    status = payments_service.get_user_subscription_authorization_status()
    if status != UserAuthorizationStatus.SUCCESS:
        return status
    return payments_service.upgrade_and_downgrade_user_subscription(price_id)

@router.get("/buy-credits")
def cancel_user_subscripion(credits_used: int, payments_service: PaymentsService = Depends(get_payments_service)):
    status = payments_service.get_user_subscription_authorization_status()
    if status != UserAuthorizationStatus.SUCCESS:
        return status
    return payments_service.charge_user_for_extra_credits(credits_used)
    
