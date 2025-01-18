from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import date
from services.payouts import PayoutsService
from dependencies import get_payouts_service
from dependencies import get_accounts_service, check_user_admin, AccountsService

router = APIRouter(dependencies=[Depends(check_user_admin)])

@router.get("/partners")
def get_payouts_partners(referral_service: PayoutsService = Depends(get_payouts_service), 
                        year: Optional[int] = Query(None),
                        month: Optional[int] = Query(None),
                        company_name: Optional[str] = Query(None)):
    return referral_service.get_payouts_partners(year=year, month=month, company_name=company_name)