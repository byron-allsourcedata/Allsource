from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from dependencies import get_accounts_service, check_user_admin, AccountsService

router = APIRouter(dependencies=[Depends(check_user_admin)])


@router.get('')
@router.get('/')
def get_partner_accounts(
    id: Optional[int] = Query(None),
    email: Optional[str] = Query(None),
    get_accounts_service: AccountsService = Depends(get_accounts_service)):
    
    account = get_accounts_service.get_accounts(id, email)
    if not account.get("status"):
        error = account.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))
     
    return account.get('data') 