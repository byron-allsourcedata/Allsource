from fastapi import APIRouter, Depends, Query
from fastapi.params import Header
from dependencies import get_users_auth_service, get_users_email_verification_service
from schemas.auth_google_token import AuthGoogleToken
from schemas.users import UserSignUpForm, UserSignUpFormResponse, UserLoginFormResponse, UserLoginForm, UpdatePassword, \
    BaseFormResponse, ResendVerificationEmailResponse, ResetPasswordForm, ResetPasswordResponse, UpdatePasswordResponse, \
    CheckVerificationStatusResponse
from services.users_auth import UsersAuth
from services.users_email_verification import UsersEmailVerificationService
from services.users import UsersService
from typing_extensions import Annotated

router = APIRouter()


@router.get("/me")
def get(user: UsersService = Depends(get_users_email_verification_service)):
    return user.get_my_info()


@router.post("/sign-up", response_model=UserSignUpFormResponse)
async def create_user(user_form: UserSignUpForm, users_service: UsersAuth = Depends(get_users_auth_service)):
    user_data = users_service.create_account(user_form)
    if user_data.get('is_success'):
        return UserSignUpFormResponse(status=user_data.get('status'), token=user_data.get("token"))
    else:
        raise Exception(user_data.get('error'))
    # return RedirectResponse(url=f"/sign-up?email={user_form.email}")


@router.post("/login", response_model=UserLoginFormResponse)
async def login_user(user_form: UserLoginForm, users_service: UsersAuth = Depends(get_users_auth_service)):
    user_data = users_service.login_account(user_form)
    if user_data.get('is_success'):
        return UserLoginFormResponse(status=user_data.get('status'), token=user_data.get("token"))
    else:
        raise Exception(user_data.get('error'))


@router.post("/sign-up_google", response_model=UserSignUpFormResponse)
async def create_user_google(auth_google_token: AuthGoogleToken, users: UsersAuth = Depends(get_users_auth_service)):
    user_data = users.create_account_google(auth_google_token)
    if user_data.get('is_success'):
        return UserSignUpFormResponse(status=user_data.get('status'), token=user_data.get("token"))
    else:
        raise Exception(user_data.get('error'))


@router.get("/authentication/verify-token", response_model=BaseFormResponse)
async def verify_token(user: UsersAuth = Depends(get_users_auth_service), token: str = Query(...),
                       skip_pricing: bool = Query(True)):
    user_data = user.verify_token(token, skip_pricing)
    if user_data.get('is_success'):
        return BaseFormResponse(status=user_data.get('status'))
    else:
        raise Exception(user_data.get('error'))


@router.post("/resend-verification-email", response_model=ResendVerificationEmailResponse)
async def resend_verification_email(authorization: Annotated[str, Header()],
                                    user: UsersEmailVerificationService = Depends(
                                        get_users_email_verification_service)):
    token = (authorization.replace("Bearer ", ""))
    user_data = user.resend_verification_email(token)
    if user_data.get('is_success'):
        return ResendVerificationEmailResponse(status=user_data.get('status'))
    else:
        raise Exception(user_data.get('error'))


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(reset_password_form: ResetPasswordForm, user: UsersAuth = Depends(get_users_auth_service)):
    user_data = user.reset_password(reset_password_form)
    if user_data.get('is_success'):
        return ResetPasswordResponse(status=user_data.get('status'))
    else:
        raise Exception(user_data.get('error'))


@router.post("/update-password", response_model=UpdatePasswordResponse)
async def update_password(update_data: UpdatePassword,
                          user: UsersEmailVerificationService = Depends(get_users_email_verification_service)):
    user_data = user.update_password(update_data)
    if user_data.get('is_success'):
        return UpdatePasswordResponse(status=user_data.get('status'))
    else:
        raise Exception(user_data.get('error'))


@router.get("/check-verification-status", response_model=CheckVerificationStatusResponse)
async def check_verification_status(
        user: UsersEmailVerificationService = Depends(get_users_email_verification_service)):
    user_data = user.check_verification_status()
    if user_data.get('is_success'):
        return CheckVerificationStatusResponse(status=user_data.get('status'))
    else:
        raise Exception(user_data.get('error'))
