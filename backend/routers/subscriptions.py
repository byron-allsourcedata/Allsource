from fastapi import APIRouter, Depends

from dependencies import get_plans_service
from services.plans import PlansService

router = APIRouter()

@router.get("/stripe_plans")
async def get_subscription_plans(plans_service: PlansService = Depends(get_plans_service)):
    return plans_service.get_subscription_plans()