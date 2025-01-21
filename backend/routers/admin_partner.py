from fastapi import APIRouter, HTTPException, Depends, Query 
from typing import Optional, List
from datetime import date
from schemas.partners import PartnerCreateRequest, PartnerUpdateRequest, PartnersResponse, OpportunityStatus
from dependencies import get_partners_service, check_user_admin, PartnersService

router = APIRouter(dependencies=[Depends(check_user_admin)])


@router.get('')
@router.get('/')
def get_partners(
    isMaster: Optional[bool] = Query(False),
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(0),
    rows_per_page: int = Query(10),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    partner = get_partners_service.get_partners(isMaster, search, start_date, end_date, page, rows_per_page)
    if not partner.get("status"):
        error = partner.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))
     
    return partner.get('data') 


@router.get('{id}', response_model=List[PartnersResponse])
@router.get('/{id}/', response_model=List[PartnersResponse])
def get_partners_by_partners_id(
    id: int,
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    partner = get_partners_service.partners_by_partners_id(id)
    if not partner.get("status"):
        error = partner.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))
     
    return partner.get('data') 


@router.post("", response_model=PartnersResponse)
@router.post("/", response_model=PartnersResponse)
async def create_partner(
    request: PartnerCreateRequest,
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    partner = await get_partners_service.create_partner(
        request.full_name,
        request.email,
        request.company_name,
        request.commission,
        request.is_master,
    )
    
    return partner.get('data') 


@router.delete("/{id}")
@router.delete("/{id}/")
async def delete_partner(
    id: int,
    message: Optional[str] = Query(None),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    partner = get_partners_service.delete_partner(id, message)
    if not partner.get("status"):
        error = partner.get("error", {}) or {}
        raise HTTPException(status_code=error.get("code", 500), detail=error.get("message", "Unknown error occurred"))
     
    return True


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


@router.put("/{partner_id}", response_model=PartnersResponse)
@router.put("/{partner_id}/", response_model=PartnersResponse)
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