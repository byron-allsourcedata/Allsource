from fastapi import APIRouter, Depends
from dependencies import get_dashboard_service
from schemas.users import CompanyInfo, CompanyInfoResponse
from services.dashboard import DashboardService

router = APIRouter()


@router.get("/")
def get(dashboard_service: DashboardService = Depends(get_dashboard_service)):
    return dashboard_service.get_my_info()
