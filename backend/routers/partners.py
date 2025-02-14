
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import Optional
from datetime import date
from schemas.partners import PartnerCreateRequest, PartnerUpdateRequest, OpportunityStatus
from services.payouts import PayoutsService
from dependencies import get_partners_assets_service, check_user_partner, get_payouts_service, get_accounts_service, get_partners_service, PartnersAssetService, AccountsService, PartnersService

router = APIRouter()

@router.get('/rewards')
@router.get('/rewards/')
def get_payouts_partners(
    referral_service: PayoutsService = Depends(get_payouts_service), 
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    partner_id: Optional[int] = Query(None),
    is_master: Optional[bool] = Query(default=False),
    from_date: int = Query(None, description="Start date in integer format"),
    to_date: int = Query(None, description="End date in integer format"),
    reward_type: Optional[str] = Query(default='partner'),
    search_query: str = Query(None, description="Search for email, first name"),
    sort_by: str = Query(None, description="Field"),
    sort_order: str = Query('desc', description="Field to sort by: 'asc' or 'desc'")):

    return referral_service.get_payouts_partners(year=year, month=month, partner_id=partner_id,
                                                 search_query=search_query, is_master=is_master,
                                                 reward_type=reward_type, from_date=from_date, to_date=to_date,
                                                 sort_by=sort_by, sort_order=sort_order)


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
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(0),
    rows_per_page: int = Query(10),
    order_by: str = Query("id"),
    order: str = Query("asc"),
    user: dict = Depends(check_user_partner),
    get_accounts_service: AccountsService = Depends(get_accounts_service)):
    
    return get_accounts_service.get_partner_accounts(user.get('id'), search, start_date, end_date, page, rows_per_page, order_by, order) 


@router.get('/')
@router.get('')
def get_masterpartner_data(
    user: dict = Depends(check_user_partner),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    response = get_partners_service.get_partner(user.get('email'))
     
    return response.get('data') 


@router.post('/')
@router.post('')
async def create_partner(
    new_partner: PartnerCreateRequest,
    get_partners_service: PartnersService = Depends(get_partners_service)):

    result = await get_partners_service.create_partner(new_partner)
     
    return result


@router.put("/opportunity/{partner_id}")
@router.put("/opportunity/{partner_id}/")
async def update_opportunity_partner(
    partner_id: int,
    payload: OpportunityStatus,
    get_partners_service: PartnersService = Depends(get_partners_service),
):
    result = await get_partners_service.update_opportunity_partner(partner_id, payload)

    return result


@router.put("/{partner_id}")
@router.put("/{partner_id}/")
async def update_partner(
    partner_id: int,
    partnerNewData: PartnerUpdateRequest,
    get_partners_service: PartnersService = Depends(get_partners_service),
):

    result = await get_partners_service.update_partner(partner_id, partnerNewData)
    
    return result


@router.get('/partners')
@router.get('/partners/')
def get_masterpartner_partners(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(0),
    rows_per_page: int = Query(10),
    user: dict = Depends(check_user_partner),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    response = get_partners_service.get_partner_partners(user.get('email'), start_date, end_date, page, rows_per_page)
     
    return response.get('data')

@router.get("/generate-token")
async def generate_token(user_account_id: int,
                         partners_service: PartnersService = Depends(get_partners_service),
                         user: dict = Depends(check_user_partner)):
    token = partners_service.generate_access_token(user=user, partner_id=user_account_id)
    if token:
        return {"token": token}
    raise HTTPException(
        status_code=403,
        detail="Access denied"
    )