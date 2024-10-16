from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.params import Header
from typing_extensions import Annotated

from dependencies import get_users_auth_service, get_users_email_verification_service, get_users_service
from schemas.auth_google_token import AuthGoogleData
from schemas.users import UserSignUpForm, UserSignUpFormResponse, UserLoginFormResponse, UserLoginForm, UpdatePassword, \
    ResendVerificationEmailResponse, ResetPasswordForm, ResetPasswordResponse, UpdatePasswordResponse, \
    CheckVerificationStatusResponse, VerifyTokenResponse
from services.users import UsersService
from services.users_auth import UsersAuth
from services.users_email_verification import UsersEmailVerificationService

router = APIRouter()


@router.get("/me")
def get_me(user_service: UsersService = Depends(get_users_service)):
    plan = user_service.get_info_plan()
    return {
        "user_info": user_service.get_my_info(),
        "user_plan": plan
    }


@router.post("/sign-up", response_model=UserSignUpFormResponse)
async def create_user(user_form: UserSignUpForm, users_service: UsersAuth = Depends(get_users_auth_service)):
    user_form.is_without_card = True
    user_data = users_service.create_account(user_form)
    if user_data.get('is_success'):
        return UserSignUpFormResponse(status=user_data.get('status'), token=user_data.get("token"))
    else:
        raise HTTPException(status_code=500, detail={'error': user_data.get('error')})


@router.post("/login", response_model=UserLoginFormResponse)
async def login_user(user_form: UserLoginForm, users_service: UsersAuth = Depends(get_users_auth_service)):
    user_data = users_service.login_account(user_form)
    if 'stripe_payment_url' in user_data:
        return UserLoginFormResponse(status=user_data.get('status'), token=user_data.get("token", None),
                                     stripe_payment_url=user_data.get('stripe_payment_url'))
    else:
        return UserLoginFormResponse(status=user_data.get('status'), token=user_data.get("token", None),
                                     stripe_payment_url=None)


@router.post("/sign-up-google", response_model=UserSignUpFormResponse)
async def create_user_google(auth_google_token: AuthGoogleData, users: UsersAuth = Depends(get_users_auth_service)):
    auth_google_token.is_without_card = True
    user_data = users.create_account_google(auth_google_token)
    return UserSignUpFormResponse(status=user_data.get('status'), token=user_data.get("token", None))


@router.post("/login-google", response_model=UserLoginFormResponse)
async def create_user_google(auth_google_token: AuthGoogleData, users: UsersAuth = Depends(get_users_auth_service)):
    user_data = users.login_google(auth_google_token)
    if 'stripe_payment_url' not in user_data:
        return UserLoginFormResponse(status=user_data.get('status'), token=user_data.get("token", None))
    return UserLoginFormResponse(status=user_data.get('status'), token=user_data.get("token", None),
                                 stripe_payment_url=user_data.get('stripe_payment_url', None))


@router.get("/authentication/verify-token", response_model=VerifyTokenResponse)
async def verify_token(user: UsersAuth = Depends(get_users_auth_service), token: str = Query(...)):
    result = user.verify_token(token)
    return VerifyTokenResponse(status=result.get('status'), token=result.get('user_token', None))


@router.post("/resend-verification-email", response_model=ResendVerificationEmailResponse)
async def resend_verification_email(authorization: Annotated[str, Header()],
                                    user: UsersEmailVerificationService = Depends(
                                        get_users_email_verification_service)):
    token = (authorization.replace("Bearer ", ""))
    user_data = user.resend_verification_email(token)
    if user_data.get('is_success'):
        return ResendVerificationEmailResponse(status=user_data.get('status'))
    else:
        raise HTTPException(status_code=500, detail={'error': user_data.get('error')})


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(reset_password_form: ResetPasswordForm, user: UsersAuth = Depends(get_users_auth_service)):
    result_status = user.reset_password(reset_password_form)
    return ResetPasswordResponse(status=result_status)


@router.post("/update-password", response_model=UpdatePasswordResponse)
async def update_password(update_data: UpdatePassword,
                          user: UsersService = Depends(get_users_service)):
    result_status = user.update_password(update_data)
    return UpdatePasswordResponse(status=result_status)


@router.get("/check-verification-status", response_model=CheckVerificationStatusResponse)
async def check_verification_status(
        user: UsersEmailVerificationService = Depends(get_users_email_verification_service)):
    result_status = user.check_verification_status()
    return CheckVerificationStatusResponse(status=result_status)
