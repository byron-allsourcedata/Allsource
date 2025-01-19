from fastapi import APIRouter, Depends, Query, Path
from typing import Optional
from schemas.admin_payouts import *
from services.payouts import PayoutsService
from dependencies import get_payouts_service
from dependencies import check_user_admin

router = APIRouter(dependencies=[Depends(check_user_admin)])

@router.get("/partners")
def get_payouts_partners(referral_service: PayoutsService = Depends(get_payouts_service), 
                        year: Optional[int] = Query(None),
                        month: Optional[int] = Query(None),
                        partner_id: Optional[int] = Query(None),
                        search_query: str = Query(None, description="Search for email, first name, lastname and phone number")):
    return referral_service.get_payouts_partners(year=year, month=month, partner_id=partner_id, search_query=search_query)

@router.put("/partners/{referral_payout_id}")
def update_payouts_partner(payouts_partner_request: PayoutsPartnerRequest, referral_service: PayoutsService = Depends(get_payouts_service),
                        referral_payout_id: int = Path(..., description="referral payout id")):
    return referral_service.update_payouts_partner(referral_payout_id, payouts_partner_request.text, payouts_partner_request.confirmation_status)

@router.get("/pay-out-referrals/{referral_payout_id}")
def pay_out_referrals(referral_service: PayoutsService = Depends(get_payouts_service), 
                        referral_payout_id: int = Path(..., description="referral payout id")):
    return referral_service.pay_out_referrals(referral_payout_id=referral_payout_id)
