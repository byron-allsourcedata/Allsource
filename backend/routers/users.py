import logging
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from ..dependencies import get_user_service
from ..schemas.users import UserSignUpForm, UserSignUpFormResponse
from ..services import users
from fastapi.responses import RedirectResponse

from ..services.users import ServiceUsers

router = APIRouter()

@router.post("/sign-up", response_model=UserSignUpFormResponse)
async def create_user(user_form: UserSignUpForm, users_service: ServiceUsers = Depends(get_user_service)):
    users_service.create_account(user_form)
    if is_special_offer:
        return RedirectResponse(url=f"/sign-up?email={user_form.email}")
    return RedirectResponse(url=f"/set_plan_without_card")



@router.post("/sign-up_google/{is_special_offer}", response_model=UserSignUpFormResponse)
async def create_user_google(user_form: UserSignUpForm, is_special_offer: str = Depends(get_special_offer),
                             users: ServiceUsers = Depends(get_user_service)):
    users.create_account_google(user_form, is_special_offer)
    return RedirectResponse(url=f"/api/v1/users/set_plan_without_card")
