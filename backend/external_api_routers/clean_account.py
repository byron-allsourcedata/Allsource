from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from schemas.users import PixelFormResponse
from dependencies import get_domain_service, UserDomainsService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=PixelFormResponse)
async def clean_account(email: str = Query(...),domain_service: UserDomainsService = Depends(get_domain_service)):
    redirect_url = domain_service.clean_account(email)
    return RedirectResponse(f'{redirect_url}')
