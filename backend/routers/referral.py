from fastapi import APIRouter, Depends

from dependencies import get_referral_service, check_user_authentication, check_user_setting_access
from models.users import User

from services.referral import ReferralService


router = APIRouter(dependencies=[Depends(check_user_setting_access)])


@router.get("/overview")
def get_overview_info(referral_service: ReferralService = Depends(get_referral_service),
                      user: User = Depends(check_user_authentication)):
    result = referral_service.get_overview_info(user)
    return result





