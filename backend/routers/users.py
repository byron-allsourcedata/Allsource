from fastapi import APIRouter, Depends, Query
from fastapi.params import Header
from dependencies import get_users_auth_service, get_users_service, get_users_email_verification_service
from models.users import Users
from schemas.auth_google_token import AuthGoogleToken
from schemas.users import UserSignUpForm, UserSignUpFormResponse, UserLoginFormResponse, UserLoginForm, \
    ResetPassword, UpdatePassword
from services.users_auth import UsersAuth
from services.users_email_verification import UsersEmailVerificationService
from services.users import UsersService
from typing_extensions import Annotated

router = APIRouter()


@router.get("/me")
def get(user: UsersService = Depends(get_users_service)):
    return user.get_my_info()


@router.post("/sign-up", response_model=UserSignUpFormResponse)
async def create_user(user_form: UserSignUpForm, users_service: UsersAuth = Depends(get_users_auth_service)):
    user_data = users_service.create_account(user_form)
    print(UserSignUpFormResponse(status=user_data.get('status'), token=user_data.get("token")))
    return UserSignUpFormResponse(status=user_data.get('status'), token=user_data.get("token"))
    # return RedirectResponse(url=f"/sign-up?email={user_form.email}")


@router.post("/login", response_model=UserLoginFormResponse)
async def login_user(user_form: UserLoginForm, users_service: UsersAuth = Depends(get_users_auth_service)):
    user_data = users_service.login_account(user_form)
    return UserLoginFormResponse(status=user_data.get('status'), token=user_data.get("token"))


@router.post("/sign-up_google", response_model=UserSignUpFormResponse)
async def create_user_google(auth_google_token: AuthGoogleToken, users: UsersAuth = Depends(get_users_auth_service)):
    user_data = users.create_account_google(auth_google_token)
    return UserSignUpFormResponse(status=user_data.get('status'), token=user_data.get("token"))


@router.get("/authentication/verify-token")
async def verify_token(user: UsersAuth = Depends(get_users_auth_service), token: str = Query(...),
                       skip_pricing: bool = Query(True)):
    return user.verify_token(token, skip_pricing)


@router.post("/resend-verification-email")
async def resend_verification_email(authorization: Annotated[str, Header()],
                                    user: UsersEmailVerificationService = Depends(
                                        get_users_email_verification_service)):
    token = (authorization.replace("Bearer ", ""))
    return user.resend_verification_email(token)


@router.post("/reset-password")
async def resend_verification_email(reset_password: ResetPassword, user: UsersAuth = Depends(get_users_auth_service)):
    return user.reset_password(reset_password)


@router.post("/update-password")
async def update_password(update_data: UpdatePassword,
                          user: UsersEmailVerificationService = Depends(get_users_email_verification_service)):
    return user.update_password(update_data)


@router.get("/check-verification-status")
async def check_verification_status(
        user: UsersEmailVerificationService = Depends(get_users_email_verification_service)):
    return user.check_verification_status()
