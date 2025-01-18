from fastapi import APIRouter, Depends, Query
from dependencies import get_referral_service, check_user_authentication, check_user_setting_access
from models.users import User
from schemas.referral import *
from services.referral import ReferralService


router = APIRouter(dependencies=[Depends(check_user_setting_access)])


@router.get("/overview", response_model=OverviewResponse)
def get_overview_info(referral_service: ReferralService = Depends(get_referral_service),
                      user: User = Depends(check_user_authentication)):
    return referral_service.get_overview_info(user)

@router.get("/rewards")
def get_rewards_info(referral_service: ReferralService = Depends(get_referral_service),
                      user: User = Depends(check_user_authentication),
                      year	: Optional[str] = Query(None),
                      month: Optional[int] = Query(None),
                      company_name: Optional[str] = Query(None)):
    return referral_service.get_rewards_info(year=year, month=month, company_name=company_name)

@router.get("/details", response_model=ReferralDetailsResponse)
def get_referral_details(referral_service: ReferralService = Depends(get_referral_service),
                         user: User = Depends(check_user_authentication),
                         discount_code_id: Optional[int] = Query(None)):
    if discount_code_id:
        return referral_service.get_referral_discount_code_by_id(discount_code_id=discount_code_id, user=user)
    return referral_service.get_referral_details(user=user)

