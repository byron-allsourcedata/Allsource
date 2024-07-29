from fastapi import APIRouter, Depends
from dependencies import get_leads_service
from schemas.users import CompanyInfo, CompanyInfoResponse
from services.leads import LeadsService

router = APIRouter()


@router.get("")
async def get_leads(leads_service: LeadsService = Depends(get_leads_service)):
    return leads_service.get_leads(page=1)

