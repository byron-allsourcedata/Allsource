from typing import Optional, List
from typing_extensions import TypedDict

from pydantic import BaseModel, Field

from enums import SignUpStatus, LoginStatus, BaseEnum, VerificationEmail, UpdatePasswordStatus, ResetPasswordEnum, \
    VerifyToken, CompanyInfoEnum, PixelStatus, StripeConnectStatus


class ShopifyPayloadModel(BaseModel):
    code: Optional[str] = None
    hmac: Optional[str] = None
    host: Optional[str] = None
    shop: Optional[str] = None
    state: Optional[str] = None
    timestamp: Optional[str] = None

class UtmParams(BaseModel):
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    awc: Optional[str] = None

class UserSignUpForm(BaseModel):
    full_name: str = Field(...)
    email: str = Field(...)
    password: str = Field(...)
    is_with_card: bool = Field(default=False)
    teams_token: Optional[str] = None
    spi: Optional[str] = None
    shopify_data: Optional[ShopifyPayloadModel] = None
    awc: Optional[str] = None
    coupon: Optional[str] = None
    ift: Optional[str] = None
    ftd: Optional[str] = None
    utm_params: Optional[UtmParams] = None


class DismissNotificationsRequest(BaseModel):
    notification_ids: Optional[List[int]] = None


class DeleteNotificationRequest(BaseModel):
    notification_id: int = Field(...)


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
    shopify_data: Optional[ShopifyPayloadModel] = None


class ResetPasswordForm(BaseModel):
    email: str = Field(...)


class UpdatePassword(BaseModel):
    password: str = Field(...)
    confirm_password: str = Field(...)


class CalendlyUUID(BaseModel):
    uuid: str = Field(...)
    invitees: str = Field(...)


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
    stripe_payment_url: Optional[str] = None
    domain_url: Optional[str] = None

class CheckVerificationStatusResponse(BaseModel):
    status: VerificationEmail


class VerifyTokenResponse(BaseModel):
    status: VerifyToken
    token: Optional[str] = None


class CalendlyDict(TypedDict):
    email: Optional[str] = None
    full_name: Optional[str] = None
    utm_params: Optional[str] = None


class CalendlyResponse(BaseModel):
    user: Optional[CalendlyDict] = None


class StripeAccountID(BaseModel):
    stripe_connect_account_id: str


class StripeConnectResponse(BaseModel):
    status: StripeConnectStatus

