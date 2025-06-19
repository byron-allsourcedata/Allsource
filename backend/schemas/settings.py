from pydantic import BaseModel, Field, root_validator
from typing import Optional, Dict, Any


class ChangePassword(BaseModel):
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class Account(BaseModel):
    full_name: Optional[str] = None
    email_address: Optional[str] = None


class BusinessInfo(BaseModel):
    organization_name: Optional[str] = None
    company_website: Optional[str] = None
    visits_to_website: Optional[str] = None


class AccountDetailsRequest(BaseModel):
    account: Optional[Account] = None
    change_password: Optional[ChangePassword] = None
    set_password: Optional[ChangePassword] = None
    business_info: Optional[BusinessInfo] = None


class ResetEmailForm(BaseModel):
    email: str = Field(...)


class TeamsDetailsRequest(BaseModel):
    pending_invitation_revoke: Optional[str] = None
    invite_user: Optional[str] = None
    remove_user: Optional[str] = None
    access_level: Optional[str] = None


class PaymentCard(BaseModel):
    payment_method_id: str = Field(...)
    email: Optional[str] = None
    is_default: Optional[bool] = False


class SendBilling(BaseModel):
    invoice_id: str
    email: str


class ApiKeysRequest(BaseModel):
    id: Optional[str] = None
    api_key: Optional[str] = None
    api_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None


class BillingCycle(BaseModel):
    detail_type: str
    plan_start: Any
    plan_end: Any


class PlanName(BaseModel):
    detail_type: str
    value: str


class LimitedDetail(BaseModel):
    detail_type: str
    limit_value: int
    current_value: int


class FundsDetail(BaseModel):
    detail_type: str
    limit_value: int
    current_value: int


class NextBillingDate(BaseModel):
    detail_type: str
    value: Optional[str]


class TotalKey(BaseModel):
    detail_type: str
    value: Optional[str]


class ActivePlan(BaseModel):
    detail_type: str
    value: bool


class SubscriptionDetails(BaseModel):
    billing_cycle: BillingCycle
    plan_name: PlanName
    domains: LimitedDetail
    contacts_downloads: LimitedDetail
    smart_audience: str
    validation_funds: FundsDetail
    premium_sources_funds: str
    next_billing_date: NextBillingDate
    monthly_total: Optional[TotalKey] = None
    yearly_total: Optional[TotalKey] = None
    active: ActivePlan


class DowngradePlan(BaseModel):
    plan_name: Optional[str]
    downgrade_at: Optional[str]


class BillingSubscriptionDetails(BaseModel):
    subscription_details: Optional[SubscriptionDetails]
    downgrade_plan: Optional[DowngradePlan]
    canceled_at: Optional[str]
