from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
from services.payouts import PayoutsService
from dependencies import get_accounts_service, get_payouts_service, check_user_admin, AccountsService, AdminCustomersService

router = APIRouter(dependencies=[Depends(check_user_admin)])


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
    order: str = Query("desk"),
    get_accounts_service: AccountsService = Depends(get_accounts_service)):
    
    accounts = get_accounts_service.get_admin_accounts(search, start_date, end_date, page, rows_per_page, order_by, order)
     
    return accounts


@router.get('/rewards-history')
@router.get('/rewards-history/')
def get_payouts_partners(
    referral_service: PayoutsService = Depends(get_payouts_service), 
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    partner_id: Optional[int] = Query(None),
    is_master: Optional[bool] = Query(default=False),
    reward_type: Optional[str] = Query(default='partner'),
    search_query: str = Query(None, description="Search for email, first name")):
    
    return referral_service.get_total_payouts(year=year, month=month, partner_id=partner_id, reward_type=reward_type)

@router.get('/rewards')
@router.get('/rewards/')
def get_payouts_partners(
    referral_service: PayoutsService = Depends(get_payouts_service), 
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    partner_id: Optional[int] = Query(None),
    is_master: Optional[bool] = Query(default=False),
    reward_type: Optional[str] = Query(default='partner'),
    search_query: str = Query(None, description="Search for email, first name")):

    return referral_service.get_payouts_partners(year=year, month=month, partner_id=partner_id, search_query=search_query, is_master=is_master, reward_type=reward_type)