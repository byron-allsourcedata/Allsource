
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import date
from dependencies import get_partners_assets_service, check_user_partner, get_accounts_service, PartnersAssetService, AccountsService

router = APIRouter(dependencies=[Depends(check_user_partner)])


@router.get('/assets')
@router.get('/assets/')
def get_partners_assets(
                get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service)):
    assets = get_partners_assets_service.get_assets()
    if not assets.get("status"):
        error = assets.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))
     
    return assets.get('data') 


@router.get('/accounts')
@router.get('/accounts/')
def get_partner_accounts(
    id: Optional[int] = Query(0),
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