from fastapi import APIRouter
from routers import subscriptions, users, company_info, pixel_installation, admin_customers, dashboard, sse_events, \
    leads, audience, integrations

router = APIRouter()

router.include_router(subscriptions.router, prefix='/subscriptions')
router.include_router(company_info.router)
router.include_router(users.router)
router.include_router(admin_customers.router, prefix='/admin')
router.include_router(pixel_installation.router, prefix='/install-pixel')
router.include_router(dashboard.router, prefix='/dashboard')
router.include_router(audience.router, prefix='/audience')
router.include_router(leads.router, prefix='/leads')
router.include_router(sse_events.router)
router.include_router(integrations.router)
