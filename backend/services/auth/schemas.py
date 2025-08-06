from pydantic import BaseModel

from enums import LoginStatus, OauthShopify


class SuccessfulLoginResult(BaseModel):
    status: LoginStatus
    token: str
    is_partner: bool
    shopify_status: OauthShopify | None = None


class LoginResult(SuccessfulLoginResult):
    stripe_payment_url: str | None = None
