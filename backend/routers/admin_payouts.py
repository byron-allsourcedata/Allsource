from fastapi import APIRouter, Depends, Query
from typing import Optional
from services.payouts import PayoutsService
from dependencies import get_payouts_service
from dependencies import check_user_admin

router = APIRouter(dependencies=[Depends(check_user_admin)])

@router.get("/partners")
def get_payouts_partners(referral_service: PayoutsService = Depends(get_payouts_service), 
                        year: Optional[int] = Query(None),
                        month: Optional[int] = Query(None),
                        partner_id: Optional[int] = Query(None)):
    return referral_service.get_payouts_partners(year=year, month=month, company_name=partner_id)