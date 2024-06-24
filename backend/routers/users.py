import logging
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from backend.dependencies import get_sql_db
from ..schemas.users import UserSignUpForm, UserSignUpFormResponse
from ..services import users
from fastapi.responses import RedirectResponse

router = APIRouter()


async def get_user_id(user_id: str = Path(None)):
    return user_id


@router.post("/sign-up/{is_special_offer}", response_model=UserSignUpFormResponse)
async def create_user(user_form: UserSignUpForm, db: Session = Depends(get_sql_db),
                      is_special_offer: str = Depends(get_user_id)):
    users.create_account(user_form, db, is_special_offer)
    if is_special_offer:
        return RedirectResponse(url=f"/api/v1/users/sign-up?email={user_form.email}")
    return RedirectResponse(url=f"/api/v1/users/set_plan_without_card")


@router.post("/sign-up_google/{is_special_offer}", response_model=UserSignUpFormResponse)
async def create_user_google(user_form: UserSignUpForm, db: Session = Depends(get_sql_db),
                             is_special_offer: str = Depends(get_user_id)):
    users.create_account_google(user_form, db, is_special_offer)
