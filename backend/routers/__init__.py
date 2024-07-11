from fastapi import APIRouter

from routers import subscriptions, users

router = APIRouter()

router.include_router(subscriptions.router)
router.include_router(users.router)
