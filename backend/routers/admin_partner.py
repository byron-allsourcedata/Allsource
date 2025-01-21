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
    
    result = get_partners_service.get_partners(isMaster, search, start_date, end_date, page, rows_per_page)
     
    return result.get('data') 


@router.get('{id}', response_model=List[PartnersResponse])
@router.get('/{id}/', response_model=List[PartnersResponse])
def get_partners_by_partners_id(
    id: int,
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    partner = get_partners_service.partners_by_partners_id(id)
     
    return partner.get('data') 


@router.post("")
@router.post("/")
async def create_partner(
    new_partner: PartnerCreateRequest,
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    result = await get_partners_service.create_partner(new_partner)
     
    return result


@router.delete("/{id}")
@router.delete("/{id}/")
async def delete_partner(
    id: int,
    message: Optional[str] = Query(None),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    result = get_partners_service.delete_partner(id, message)
     
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