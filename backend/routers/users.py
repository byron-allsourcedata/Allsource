import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.dependencies import get_sql_db
from ..schemas.users import SignIn, UserSignUpForm, UserSignUpFormResponse
from ..services import users
import traceback

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/sign-up", response_model=UserSignUpFormResponse)
async def create_user(user_form: UserSignUpForm, db: Session = Depends(get_sql_db)):
    try:
        result = users.create_account(user_form, db)
        if result['is_success']:
            return {"is_success": result['is_success'], "data": result['data']}
        else:
            return {"is_success": result['is_success'], "error": result['error']}
    except Exception as e:
        tb = traceback.format_exc()
        print(tb)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail={"message": "An error occurred during login", "error": str(e)})

