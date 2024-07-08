from typing import Optional
from pydantic import BaseModel, Field
from backend.enums import SignUpStatus, LoginStatus


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
