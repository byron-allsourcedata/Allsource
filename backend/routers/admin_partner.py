from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
from schemas.partners_asset import PartnerCreateRequest, PartnerUpdateRequest
from dependencies import get_partners_service, check_user_admin, PartnersService

router = APIRouter(dependencies=[Depends(check_user_admin)])


@router.get('')
@router.get('/')
def partners(
    isMaster: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(0),
    rowsPerPage: int = Query(10),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    assets = get_partners_service.get_partners(isMaster, search, start_date, end_date, page, rowsPerPage)
    return {"items": assets["items"], "totalCount": assets["totalCount"]}


@router.get('{id}')
@router.get('/{id}/')
def partners_by_partners_id(
    id: int,
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    assets = get_partners_service.partners_by_partners_id(id)
    return assets


@router.post("")
@router.post("/")
async def create_partner(
    request: PartnerCreateRequest,
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    partner = await get_partners_service.create_partner(
        request.full_name,
        request.email,
        request.company_name,
        request.commission,
        request.isMaster,
    )
    return partner


@router.delete("/{id}")
@router.delete("/{id}/")
async def delete_partner(
    id: int,
    message: Optional[str] = Query(None),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    status = get_partners_service.delete_asset(id, message)
    return {"status": status, "data": None}


@router.put("/{partner_id}")
@router.put("/{partner_id}/")
async def update_partner(
    partner_id: int,
    request: PartnerUpdateRequest,
    get_partners_service: PartnersService = Depends(get_partners_service)):

    if request.status:
        if request.message:
            partner = await get_partners_service.update_partner(partner_id, "status", request.status, request.message)
        else:
            partner = await get_partners_service.update_partner(partner_id, "status", request.status, "Your account active again")
    else: 
        partner = await get_partners_service.update_partner(partner_id, "commission", request.commission, "Your commission has been changed")
    return partner