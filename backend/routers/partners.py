
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
    start_date: int = Query(None, description="Start date in integer format"),
    end_date: int = Query(None, description="End date in integer format"),
    page: int = Query(0),
    rowsPerPage: int = Query(10),
    user: dict = Depends(check_user_partner),
    get_accounts_service: AccountsService = Depends(get_accounts_service)):
    
    return get_accounts_service.get_accounts(user, search, start_date, end_date, page, rowsPerPage)     


@router.get('/')
@router.get('')
def get_masterpartner_data(
    email: Optional[str] = Query(...),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    response = get_partners_service.get_partner(email)
    if not response.get("status"):
        error = response.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))
     
    return response.get('data') 


@router.post('/')
@router.post('')
async def create_partner(
    request: PartnerCreateRequest,
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    partner = await get_partners_service.create_partner(
        request.full_name,
        request.email,
        request.company_name,
        request.commission,
        request.isMaster,
        request.masterId,
    )

    if not partner.get("status"):
        error = partner.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))
     
    return partner.get('data') 


@router.put("/opportunity/{partner_id}")
@router.put("/opportunity/{partner_id}/")
async def update_opportunity_partner(
    partner_id: int,
    payload: OpportunityStatus,
    get_partners_service: PartnersService = Depends(get_partners_service),
):

    partner = await get_partners_service.update_opportunity_partner(partner_id, payload)

    if not partner.get("status"):
        error = partner.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))

    return True


@router.put("/{partner_id}")
@router.put("/{partner_id}/")
async def update_partner(
    partner_id: int,
    request: PartnerUpdateRequest,
    get_partners_service: PartnersService = Depends(get_partners_service),
):
    full_name = getattr(request, "full_name", None)
    company_name = getattr(request, "company_name", None)

    if request.status:
        message = request.message or "Your account active again"
        partner = await get_partners_service.update_partner(
            partner_id, "status", request.status, message, full_name, company_name
        )
    else:
        partner = await get_partners_service.update_partner(
            partner_id, "commission", request.commission, "Your commission has been changed", full_name, company_name
        )

    if not partner.get("status"):
        error = partner.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))

    return partner.get("data")


@router.get('/partners')
@router.get('/partners/')
def get_masterpartner_partners(
    email: Optional[str] = Query(...),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(0),
    rowsPerPage: int = Query(10),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    response = get_partners_service.get_partner_partners(email, start_date, end_date, page, rowsPerPage)
    if not response.get("status"):
        error = response.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))
     
    return response.get('data') 