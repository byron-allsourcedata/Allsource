from typing import Optional
from pydantic import BaseModel, Field
from enums import SignUpStatus, LoginStatus, BaseEnum, VerificationEmail, UpdatePasswordStatus

class UserSignUpForm(BaseModel):
    full_name: str = Field(...)
    email: str = Field(...)
    password: str = Field(...)
    is_without_card: bool = Field(...)


class UserSignUpFormResponse(BaseModel):
    status: SignUpStatus
    token: Optional[str] = None


class UserLoginFormResponse(BaseModel):
    status: LoginStatus
    token: Optional[str] = None


class UserLoginForm(BaseModel):
    email: str = Field(...)
    password: str = Field(...)


class ResetPassword(BaseModel):
    email: str = Field(...)


class UpdatePassword(BaseModel):
    email: str = Field(...)
    confirm_password: str = Field(...)

# class StatusFormResponse(BaseModel):
#     status: Union[BaseEnum, VerificationEmail, SignUpStatus, UpdatePasswordStatus]
