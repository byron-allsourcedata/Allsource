from fastapi import APIRouter, Depends, Form, Query
from typing import Optional
from dependencies import get_partners_service, check_user_admin, PartnersService

router = APIRouter(dependencies=[Depends(check_user_admin)])


@router.get('')
@router.get('/')
def partners(
    isMaster: Optional[str] = Query(...),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    assets = get_partners_service.get_partners(isMaster)
    return assets


@router.post("")
@router.post("/")
async def create_partner(
    full_name: str = Form(...),
    email: str = Form(...),
    company_name: str = Form(...),
    commission: str = Form(...),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    partner = await get_partners_service.create_partner(full_name, email, company_name, commission)
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
    status: str = Form(None),
    commission: str = Form(None),
    message: Optional[str] = Query(None),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    if status:
        if message:
            partner = await get_partners_service.update_partner(partner_id, "status", status, message)
        else:
            partner = await get_partners_service.update_partner(partner_id, "status", status, "Your account active again")
    else: 
        partner = await get_partners_service.update_partner(partner_id, "commission", commission, message)
    return partner