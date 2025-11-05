from fastapi import APIRouter, Body, Depends
from dependencies import (
    check_user_authentication,
    check_user_authorization_without_pixel,
)

router = APIRouter()


@router.post("/test", response_model=bool)
async def set_company_info(request=Body(...)):
    print(request)
