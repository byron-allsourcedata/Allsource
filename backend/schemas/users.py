from typing import Optional, List

from pydantic import BaseModel, Field

from enums import SignUpStatus, LoginStatus, BaseEnum, VerificationEmail, UpdatePasswordStatus, ResetPasswordEnum, \
    VerifyToken, CompanyInfoEnum, PixelStatus


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
    stripe_payment_url: Optional[str] = None


class PixelFormResponse(BaseModel):
    status: PixelStatus


class UserLoginForm(BaseModel):
    email: str = Field(...)
    password: str = Field(...)


class ResetPasswordForm(BaseModel):
    email: str = Field(...)


class UpdatePassword(BaseModel):
    password: str = Field(...)
    confirm_password: str = Field(...)


class CompanyInfo(BaseModel):
    organization_name: str = Field(...)
    company_website: str = Field(...)
    company_role: str = Field(...)
    monthly_visits: str = Field(...)
    employees_workers: str = Field(...)


class BaseFormResponse(BaseModel):
    status: BaseEnum


class ResendVerificationEmailResponse(BaseModel):
    status: VerificationEmail


class ResetPasswordResponse(BaseModel):
    status: ResetPasswordEnum


class UpdatePasswordResponse(BaseModel):
    status: UpdatePasswordStatus


class CompanyInfoResponse(BaseModel):
    status: CompanyInfoEnum


class CheckVerificationStatusResponse(BaseModel):
    status: VerificationEmail


class VerifyTokenResponse(BaseModel):
    status: VerifyToken
    token: Optional[str] = None
