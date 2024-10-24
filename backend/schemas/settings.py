from pydantic import BaseModel, Field
from typing import Optional

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
    
class SendBilling(BaseModel):
    invoice_id: str = Field(...)
    email: str = Field(...)
    
class ApiKeysRequest(BaseModel):
    id: Optional[str] = None
    api_key: Optional[str] = None
    api_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None