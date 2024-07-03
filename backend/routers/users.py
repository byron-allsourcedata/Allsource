from fastapi import APIRouter, Depends, Query
from fastapi.params import Header
from ..dependencies import get_users_auth, get_users
from ..schemas.users import UserSignUpForm, UserSignUpFormResponse, UserLoginFormResponse, UserLoginForm
from ..services.users_auth import UsersAuth
from ..services.users import Users
from typing_extensions import Annotated

router = APIRouter()


@router.get("/me")
def get(user: Users = Depends(get_users)):
    return user.get_my_info()


@router.post("/sign-up", response_model=UserSignUpFormResponse)
async def create_user(user_form: UserSignUpForm, users_service: UsersAuth = Depends(get_users_auth)):
    user_data = users_service.create_account(user_form)
    return UserSignUpFormResponse(status=user_data.get('status'), token=user_data.get("token"))
    # return RedirectResponse(url=f"/sign-up?email={user_form.email}")


@router.post("/login", response_model=UserLoginFormResponse)
async def login_user(user_form: UserLoginForm, users_service: UsersAuth = Depends(get_users_auth)):
    user_data = users_service.login_account(user_form)
    return UserLoginFormResponse(status=user_data.get('status'), token=user_data.get("token"))
    # return RedirectResponse(url=f"/sign-up?email={user_form.email}")


@router.post("/sign-up_google", response_model=UserSignUpFormResponse)
async def create_user_google(user_form: UserSignUpForm, users: UsersAuth = Depends(get_users_auth)):
    users.create_account_google(user_form)
    # return RedirectResponse(url=f"/api/v1/users/set_plan_without_card")


@router.get("/authentication/verify-token")
async def verify_token(users: UsersAuth = Depends(get_users_auth), token: str = Query(...),
                       skip_pricing: bool = Query(True)):

    return users.verify_token(token, skip_pricing)


@router.post("/resend-verification-email")
async def resend_verification_email(authorization: Annotated[str, Header()], user: Users = Depends(get_users)):
    token = (authorization.replace("Bearer ", ""))
    return user.resend_verification_email(token)


@router.get("/check-verification-status")
async def check_verification_status(user: Users = Depends(get_users)):
    return user.check_verification_status()
