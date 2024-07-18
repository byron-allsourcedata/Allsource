from fastapi import APIRouter
from routers import subscriptions, users, company_info, pixel_installation, admin_customers

router = APIRouter()

router.include_router(subscriptions.router, prefix='/subscriptions')
router.include_router(company_info.router)
router.include_router(users.router)
router.include_router(admin_customers.router, prefix='/admin')
router.include_router(pixel_installation.router, prefix='/install-pixel')
