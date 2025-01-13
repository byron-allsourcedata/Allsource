from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import date
from dependencies import get_accounts_service, check_user_admin, AccountsService

router = APIRouter(dependencies=[Depends(check_user_admin)])


@router.get('')
@router.get('/')
def get_partner_accounts(
    id: Optional[int] = Query(None),
    email: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(0),
    rowsPerPage: int = Query(10),
    get_accounts_service: AccountsService = Depends(get_accounts_service)):
    
    account = get_accounts_service.get_accounts(id, email, search, start_date, end_date, page, rowsPerPage)
    if not account.get("status"):
        error = account.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))
     
    return account.get('data') 