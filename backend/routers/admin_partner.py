from fastapi import APIRouter, Depends, UploadFile, File, Form
from dependencies import get_partners_service, check_user_admin, PartnersService

router = APIRouter(dependencies=[Depends(check_user_admin)])


@router.get('')
@router.get('/')
def partners(
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    assets = get_partners_service.get_partners()
    return assets


@router.delete("/{id}/")
@router.delete("/{id}/")
async def create_partner(
    full_name: str = Form(...),
    email: str = Form(...),
    company_name: str = Form(...),
    commission: str = Form(...),
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    partner = await get_partners_service.create_partner(full_name, email, company_name, commission)
    return partner


@router.put("/{partner_id}")
@router.put("/{partner_id}")
async def update_partner(
    partner_id: int,
    commission: int,
    get_partners_service: PartnersService = Depends(get_partners_service)):
    
    partner = await get_partners_service.update_partner(partner_id, commission)
    return partner