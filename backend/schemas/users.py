from typing import Optional
from fastapi import Form
from pydantic import BaseModel, Field

from backend.enums import SignUpStatus


class UserSignUpForm(BaseModel):
    email: str = Field(...)
    password: str = Field(...)
    first_name: str = Field(...)
    last_name: str = Field(...)
    company: Optional[str]
    website: Optional[str]


class UserSignUpFormResponse(BaseModel):
    status: SignUpStatus
    token: Optional[str] = None


class SignIn(BaseModel):
    username: Optional[str] = Form(None, alias="username")
    password: Optional[str] = Form(None, alias="password")
