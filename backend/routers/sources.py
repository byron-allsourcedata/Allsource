from fastapi import APIRouter, Depends, Query
from dependencies import get_audience_sources_service, get_domain_service, check_user_authorization_without_pixel
from services.audience_sources import AudienceSourceService
from services.domains import UserDomainsService
from schemas.audience import HeadingSubstitutionRequest, NewSource, SourcesObjectResponse, SourceResponse, \
    DomainsLeads, DomainsSourceResponse
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from fastapi.responses import FileResponse

router = APIRouter(dependencies=[Depends(check_user_authorization_without_pixel)])

@router.get("", response_model=SourcesObjectResponse)
def get_sources(
        user=Depends(check_user_authorization_without_pixel),
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(10, alias="per_page", ge=1, le=500, description="Items per page"),
        sort_by: str = Query(None, description="Field to sort by"),
        sort_order: str = Query(None, description="Sort order: 'asc' or 'desc'"),
        name: Optional[str] = Query(None, description="Filter by source name"),
        source_type: Optional[str] = Query(None, description="Source type"),
        source_origin: Optional[str] = Query(None, description="Type of customers"),
        domain_name: Optional[str] = Query(None, description="Domain of customers"),
        created_date_start: Optional[datetime] = Query(None, description="Start date of creation interval"),
        created_date_end: Optional[datetime] = Query(None, description="End date of creation interval"),
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    source_list, count = sources_service.get_sources(
        user=user,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page,
        name=name,
        source_type=source_type,
        source_origin=source_origin,
        domain_name=domain_name,
        created_date_start=created_date_start,
        created_date_end=created_date_end,
    )

    return {
        "source_list": source_list,
        "count": count
    }

@router.get("/domains-with-leads", response_model=List[DomainsLeads])
def get_domains_with_leads(
        user=Depends(check_user_authorization_without_pixel),
        domains_service: UserDomainsService = Depends(get_domain_service)
):
    domain_list = domains_service.get_domains_with_leads(user=user)
    
    return domain_list


@router.post("/heading-substitution", response_model=Optional[List[str]])
def substitution_headings(
        payload: HeadingSubstitutionRequest,
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return sources_service.substitution_headings(payload.source_type, payload.headings)


@router.post("/create", response_model=SourceResponse)
async def create_source(
        payload: NewSource,
        user=Depends(check_user_authorization_without_pixel),
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return await sources_service.create_source(user=user, payload=payload)


@router.delete("/{id}", response_model=bool)
def delete_source(
        id: UUID,
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return sources_service.delete_source(
        id=id
    )


@router.get("/sample-customers-list")
def get_sample_customers_list(
    source_type: str = Query(...),
    sources_service: AudienceSourceService = Depends(get_audience_sources_service)):
    file_path = sources_service.get_sample_customers_list(source_type)
    return FileResponse(file_path, media_type="text/csv",
                        headers={"Content-Disposition": "attachment; filename=sample-customers-list.csv"})


@router.get("/get-processing-source", response_model=Optional[SourceResponse])
def get_processing_source(
        id: str = Query(...),
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)):
    return sources_service.get_processing_source(id)


@router.get("/domains", response_model=DomainsSourceResponse)
def get_domains(
        user=Depends(check_user_authorization_without_pixel),
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(10, alias="per_page", ge=1, le=500, description="Items per page"),
        sources_service: AudienceSourceService = Depends(get_audience_sources_service),
):
    return sources_service.get_domains(user_id=user.get("id"), page=page, per_page=per_page)