from typing import List
from pydantic import BaseModel, Field

class ChangePassword(BaseModel):
    current_password: str = Field(...)
    new_password: str = Field(...)

class Name(BaseModel):
    full_name: str = Field(...)
    email_address: str = Field(...)

class BusinessInfo(BaseModel):
    organization_name: str = Field(...)
    company_website: str = Field(...)
    visits_to_website: str = Field(...)

class AccountDetailsRequest(BaseModel):
    name: Name = Field(...)
    change_password: ChangePassword = Field(...)
    business_info: BusinessInfo = Field(...)
    
class TeamsDetailsRequest(BaseModel):
    pending_invitation_revoke: str = Field(...)
    invite_user: str = Field(...)
    remove_user: str = Field(...)
