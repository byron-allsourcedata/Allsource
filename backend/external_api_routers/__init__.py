from fastapi import APIRouter
from external_api_routers import pixel_installation

subapi_router = APIRouter(prefix='/external_api')

subapi_router.include_router(pixel_installation.router, prefix='/install-pixel')
