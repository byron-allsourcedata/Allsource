from fastapi import APIRouter, Depends, Form, Query
from typing import Optional
from dependencies import get_accounts_service, get_partners_service, check_user_admin, PartnersService, AccountsService

router = APIRouter(dependencies=[Depends(check_user_admin)])


@router.get('')
@router.get('/')
def accounts_by_id(
    id: Optional[int] = Query(None),
    get_accounts_service: PartnersService = Depends(get_accounts_service)):
    
    assets = get_accounts_service.get_accounts_by_id(id)
    return assets