from fastapi import APIRouter, Depends
from dependencies import (
    check_user_authentication,
    check_user_authorization_without_pixel,
)
from schemas.users import CompanyInfo, CompanyInfoResponse
from schemas.teams import ChosenOwnerUser
from services.account_setup import CompanyInfoService
from services.teams import TeamsService

router = APIRouter()


@router.post("/set-team-member", response_model=bool)
async def set_company_info(
    chosen_owner_user: ChosenOwnerUser,
    team_service: TeamsService,
    user=Depends(check_user_authentication),
):
    return team_service.set_team_member(
        chosen_owner_user=chosen_owner_user, user_id=user.get("id")
    )
