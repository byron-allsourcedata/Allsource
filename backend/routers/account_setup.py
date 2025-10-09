from fastapi import APIRouter, Depends, Query
from models.users import Users
from schemas.account_setup import PotentialTeamMembers
from dependencies import check_user_authentication, get_company_info_service
from schemas.users import CompanyInfo, CompanyInfoResponse
from services.account_setup import CompanyInfoService

router = APIRouter()


@router.post("/company-info", response_model=CompanyInfoResponse)
async def set_company_info(
    company_info: CompanyInfo,
    company_info_service: CompanyInfoService = Depends(
        get_company_info_service
    ),
):
    result_status = company_info_service.set_company_info(company_info)
    return CompanyInfoResponse(
        status=result_status.get("status"),
        stripe_payment_url=result_status.get("stripe_payment_url"),
        error=result_status.get("error"),
    )


@router.get("/company-info")
async def get_company_info(
    company_info_service: CompanyInfoService = Depends(
        get_company_info_service
    ),
):
    result = company_info_service.get_company_info()
    return CompanyInfoResponse(
        status=result.get("status"), domain_url=result.get("domain_url")
    )


@router.get(
    "/potential-team-members", response_model=list[PotentialTeamMembers]
)
def get_company_info(
    user=Depends(check_user_authentication),
    company_info_service: CompanyInfoService = Depends(
        get_company_info_service
    ),
):
    return company_info_service.get_potential_team_members(
        user_email=user.get("email"), user_id=user.get("id")
    )
