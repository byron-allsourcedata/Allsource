import logging

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from starlette.responses import JSONResponse

from dependencies import get_domain_service
from services.domains import UserDomainsService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_class=JSONResponse)
async def clean_account(
    domain_service: UserDomainsService,
    email: str = Query(...)
):
    redirect_url = domain_service.clean_account(email)
    if not redirect_url:
        return JSONResponse(
            content={"message": "Account not found."}, status_code=200
        )

    return RedirectResponse(url=redirect_url)
