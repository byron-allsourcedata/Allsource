from fastapi import APIRouter, HTTPException, Depends, Query 
from typing import Optional, List
from datetime import date
from services.payouts import PayoutsService
from schemas.partners import PartnerCreateRequest, PartnerUpdateRequest, PartnersResponse, OpportunityStatus
from dependencies import get_partners_service, get_payouts_service, check_user_admin, PartnersService

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


@router.get('{id}')
@router.get('/{id}/')
def get_partners_by_partner_id(
    id: int,
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(0),
    rows_per_page: int = Query(10),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    partner = get_partners_service.partners_by_partner_id(id, search, start_date, end_date, page, rows_per_page)
     
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
    message: str = Query(...),
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