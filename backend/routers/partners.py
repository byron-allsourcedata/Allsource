
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from dependencies import get_partners_assets_service, check_user_partner, get_accounts_service, PartnersAssetService, AccountsService

router = APIRouter(dependencies=[Depends(check_user_partner)])


@router.get('/assets')
@router.get('/assets/')
def get_partners_assets(
                get_partners_assets_service: PartnersAssetService = Depends(get_partners_assets_service)):
    assets = get_partners_assets_service.get_assets()
    return assets


@router.get('/accounts')
@router.get('/accounts/')
def get_partner_accounts(
    id: Optional[int] = Query(None),
    email: Optional[str] = Query(None),
    get_accounts_service: AccountsService = Depends(get_accounts_service)):
    
    account = get_accounts_service.get_accounts(id, email)
    if not account.get("status"):
        error = account.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))
     
    return account.get('data') 