from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import date
from dependencies import get_accounts_service, get_admin_customers_service, check_user_admin, AccountsService, AdminCustomersService

router = APIRouter()


@router.get('/{id}')
@router.get('/{id}/')
def get_partner_accounts(
    id: int,
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(0),
    rows_per_page: int = Query(10),
    order_by: str = Query("id"),
    order: str = Query("asc"),
    get_accounts_service: AccountsService = Depends(get_accounts_service)):
    
    accounts = get_accounts_service.get_partner_by_id_accounts(id, search, start_date, end_date, page, rows_per_page, order_by, order)

    return accounts


@router.get('')
@router.get('/')
def get_accounts(
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(0),
    rows_per_page: int = Query(10),
    order_by: str = Query("id"),
    order: str = Query("asc"),
    get_accounts_service: AccountsService = Depends(get_accounts_service)):
    
    accounts = get_accounts_service.get_admin_accounts(search, start_date, end_date, page, rows_per_page, order_by, order)
     
    return accounts
