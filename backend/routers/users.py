import logging
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from ..dependencies import get_user_service
from ..schemas.users import UserSignUpForm, UserSignUpFormResponse
from ..services import user_auth_service
from fastapi.responses import RedirectResponse

from ..services.user_auth_service import UserAuthService

router = APIRouter()

@router.post("/sign-up", response_model=UserSignUpFormResponse)
async def create_user(user_form: UserSignUpForm, users_service: UserAuthService = Depends(get_user_service)):
    user_data = users_service.create_account(user_form)
    return UserSignUpFormResponse(status=user_data.get('status'), token=user_data.get("token"))
    # return RedirectResponse(url=f"/sign-up?email={user_form.email}")



@router.post("/sign-up_google", response_model=UserSignUpFormResponse)
async def create_user_google(user_form: UserSignUpForm, users: UserAuthService = Depends(get_user_service)):
    users.create_account_google(user_form)
    return RedirectResponse(url=f"/api/v1/users/set_plan_without_card")
