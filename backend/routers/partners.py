
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import date
from schemas.partners import PartnerCreateRequest, PartnerUpdateRequest, OpportunityStatus
from dependencies import get_partners_assets_service, check_user_partner, get_accounts_service, get_partners_service, PartnersAssetService, AccountsService, PartnersService

router = APIRouter()

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