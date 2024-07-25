from fastapi import APIRouter, Depends, Query
from dependencies import get_admin_customers_service
from services.admin_customers import AdminCustomersService

router = APIRouter()


@router.get("/confirm_customer")
async def verify_token(admin_customers_service: AdminCustomersService = Depends(get_admin_customers_service), mail: str = Query(...), free_trial: bool= Query(...)):
    return admin_customers_service.confirmation_customer(mail, free_trial)

