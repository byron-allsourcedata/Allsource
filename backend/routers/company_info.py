from fastapi import APIRouter, Depends
from dependencies import get_company_info_service
from schemas.users import CompanyInfo, CompanyInfoResponse
from services import company_info
from services.company_info import CompanyInfoService

router = APIRouter()


@router.post("/company-info", response_model=CompanyInfoResponse)
async def set_company_info(company_info: CompanyInfo,
                           company_info_service: CompanyInfoService = Depends(get_company_info_service)):
    result_status = company_info_service.set_company_info(company_info)
    return CompanyInfoResponse(status=result_status.get('status'),
                               stripe_payment_url=result_status.get('stripe_payment_url'))


@router.get("/company-info")
async def set_company_info(company_info_service: CompanyInfoService = Depends(get_company_info_service)):
    result_status = company_info_service.get_company_info()
    return CompanyInfoResponse(status=result_status)
