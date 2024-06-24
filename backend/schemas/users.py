from typing import Optional
from fastapi import Form
from pydantic import BaseModel, Field

from backend.enums import SignUpStatus


class UserSignUpForm(BaseModel):
    full_name: str = Field(...)
    email: str = Field(...)
    password: str = Field(...)


class UserSignUpFormResponse(BaseModel):
    status: SignUpStatus
    token: Optional[str] = None


class SignIn(BaseModel):
    email: str = Field(...)
    password: str = Field(...)
