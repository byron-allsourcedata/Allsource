from typing import Optional
from fastapi import Form
from pydantic import BaseModel
from ..services.auth import get_password_hash


class UserSignUpForm(BaseModel):
    email: Optional[str]
    password: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    image: Optional[str]
    company: Optional[str]
    website: Optional[str]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.password = get_password_hash(self.password)


class UserSignUpFormResponse(BaseModel):
    is_success: bool
    data: Optional[dict] = None
    error: Optional[dict] = None


class SignIn(BaseModel):
    username: Optional[str] = Form(None, alias="username")
    password: Optional[str] = Form(None, alias="password")
