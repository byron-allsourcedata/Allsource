from fastapi import APIRouter, Depends, Request as fastRequest

from dependencies import get_plans_service, get_payments_service, get_webhook
from enums import UserAuthorizationStatus
from services.plans import PlansService
from services.webhook import WebhookService

router = APIRouter()


@router.get("/stripe-plans")
async def get_subscription_plans(plans_service: PlansService = Depends(get_plans_service)):
    status = plans_service.get_user_subscription_authorization_status()
    if status != UserAuthorizationStatus.SUCCESS:
        return status
    return plans_service.get_subscription_plans()


@router.get("/session/new")
async def create_customer_session(price_id: str, payments_service=Depends(get_payments_service)):
    status = payments_service.get_user_subscription_authorization_status()
    if status != UserAuthorizationStatus.SUCCESS:
        return status
    return payments_service.create_customer_session(price_id)


@router.post("/update-subscription-webhook")
async def update_payment_confirmation(request: fastRequest, webhook_service: WebhookService = Depends(get_webhook)):
    payload = await request.json()
    return webhook_service.update_payment_confirmation(payload)



# @router.post("/{new_price_id}/upgrade-downgrade")
# def upgrade_downgrade_subscription_pan(new_price_id: str, db: Session = Depends(get_sql_db), user: Token = Depends(valid_user)):
#     new_stripe_price_obj = stripe.Price.retrieve(new_price_id)

#     current_price_obj = subscriptions.get_subscription(db, user.parent_id)

#     if current_price_obj.is_cancelled == True:
#         did_subscription_renewal = subscriptions.renew_subscription(new_price_id, user.customer_id)
#         if did_subscription_renewal:
#             return {"data": "Plan renewal successfully"}
#         else:
#             return {"data": "Renewal failed"}

#     elif subscriptions.is_upgrade(current_price_obj.price, new_stripe_price_obj):

#         did_subscription_upgrade = subscriptions.do_upgrade(new_price_id, current_price_obj)
#         if did_subscription_upgrade:
#             return {"data": "Plan upgraded successfully"}
#         else:
#             return {"data": "Upgrade failed"}

#     elif subscriptions.is_d owngrade(current_price_obj.price, new_stripe_price_obj):
#         did_subscription_downgrade = subscriptions.do_downgrade(new_price_id, current_price_obj)
#         if did_subscription_downgrade:
#             return {"data": "Plan downgraded successfully"}
#         else:
#             return {"data": "Downgrade failed"}
#     elif current_price_obj.is_trial and new_stripe_price_obj.get("id", "") == current_price_obj.price_id:
#         # The same price and user on trial period => Cancel trial right now
#         did_trial_cancel = subscriptions.cancel_trial(current_price_obj)
#         if did_trial_cancel:
#             return {"data": "Trial was cancelled successfully"}
#     else:

#         return {"data": "There was no change in plan"}
    

@router.post("/cancel-plan")
def cancel_user_subscripion(payments_service=Depends(get_payments_service)):
    status = payments_service.get_user_subscription_authorization_status()
    if status != UserAuthorizationStatus.SUCCESS:
        return status
    return payments_service.cancel_user_subscripion()
    
