from fastapi import APIRouter, Depends, Request as fastRequest

from dependencies import get_plans_service, get_payments_service, get_webhook
from services.plans import PlansService
from services.webhook import WebhookService

router = APIRouter()


@router.get("/stripe-plans")
async def get_subscription_plans(plans_service: PlansService = Depends(get_plans_service)):
    return plans_service.get_subscription_plans()


@router.get("/session/new")
async def create_customer_session(price_id: str, payments_service=Depends(get_payments_service)):
    return payments_service.create_customer_session(price_id)


@router.post("/update-subscription-webhook")
async def update_payment_confirmation(request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)):
    payload = await request.json()
    webhook_service.update_payment_confirmation(payload)
