from fastapi import APIRouter

from routers import subscriptions, users, company_info

router = APIRouter()

router.include_router(subscriptions.router, prefix='/subscriptions')
router.include_router(company_info.router)
router.include_router(users.router)
