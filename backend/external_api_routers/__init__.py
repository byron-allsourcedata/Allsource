from fastapi import APIRouter
from external_api_routers import pixel_installation
from . import clean_account

subapi_router = APIRouter(prefix='/external_api')

subapi_router.include_router(pixel_installation.router, prefix='/install-pixel')

subapi_router.include_router(clean_account.router, prefix='/clean-account')
