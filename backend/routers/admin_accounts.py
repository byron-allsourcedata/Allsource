from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import date
from dependencies import get_accounts_service, check_user_admin, AccountsService

router = APIRouter()


@router.get('')
@router.get('/')
def get_partner_accounts(
    id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(0),
    rowsPerPage: int = Query(10),
    user: dict = Depends(check_user_admin),
    get_accounts_service: AccountsService = Depends(get_accounts_service)):
    
    return get_accounts_service.get_accounts(user, search, start_date, end_date, page, rowsPerPage, partner_id=id)