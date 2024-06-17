import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.dependencies import get_sql_db
from ..schemas.users import UserSignUpForm, UserSignUpFormResponse
from ..services import users

router = APIRouter()


@router.post("/sign-up", response_model=UserSignUpFormResponse)
async def create_user(user_form: UserSignUpForm, db: Session = Depends(get_sql_db)):
    users.create_account(user_form, db)

