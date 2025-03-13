from datetime import datetime

from fastapi import APIRouter, Depends, Query, Body
from dependencies import get_audience_sources_service, check_user_authorization, check_user_authentication
from enums import TypeOfSourceOrigin, TypeOfCustomer
from models.users import Users
from services.audience_sources import AudienceSourceService
from schemas.audience import HeadingSubstitutionRequest, NewSource, SourcesObjectResponse, SourceResponse, SourceIDs
from uuid import UUID
from typing import Optional, List
from fastapi.responses import FileResponse

router = APIRouter(dependencies=[Depends(check_user_authorization)])

@router.get("", response_model=SourcesObjectResponse)
def get_sources(
        user=Depends(check_user_authorization),
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(10, alias="per_page", ge=1, le=500, description="Items per page"),
        sort_by: str = Query(None, description="Field"),
        sort_order: str = Query(None, description="Field to sort by: 'asc' or 'desc'"),
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    source_list, count = sources_service.get_sources(
        user=user,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page,
    )
    return {
        "source_list": source_list,
        "count": count
    }


@router.post("/heading-substitution", response_model=Optional[List[str]])
def substitution_headings(
        payload: HeadingSubstitutionRequest,
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return sources_service.substitution_headings(payload.source_type, payload.headings)


@router.post("/create", response_model=SourceResponse)
async def create_source(
        payload: NewSource,
        user=Depends(check_user_authorization),
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return await sources_service.create_source(
        user=user,
        source_type=payload.source_type,
        source_origin=payload.source_origin,
        source_name=payload.source_name,
        file_url=payload.file_url,
        rows=payload.rows,
    )


@router.delete("/{id}", response_model=bool)
def delete_source(
        id: UUID,
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return sources_service.delete_source(
        id=id
    )


@router.get("/sample-customers-list")
def get_sample_customers_list(sources_service: AudienceSourceService = Depends(get_audience_sources_service)):
    file_path = sources_service.get_sample_customers_list()
    return FileResponse(file_path, media_type="text/csv",
                        headers={"Content-Disposition": "attachment; filename=sample-customers-list.csv"})


@router.post("/get-processing-sources")
def get_processing_sources(
        data: SourceIDs,
        user=Depends(check_user_authorization),
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)):
    return sources_service.get_processing_sources(data.sources_ids, user=user)

@router.get("/filter")
async def get_sources(
    name: Optional[str] = Query(None, description="Filter by source name"),
    source: Optional[TypeOfSourceOrigin] = Query(None, description="Source type"),
    type_customer: Optional[List[TypeOfCustomer]] = Query(None, description="Type of customers"),
    domain_id: Optional[int] = Query(None, description="Domain of customers"),
    created_date: Optional[datetime] = Query(None, description="Created date"),
    user: Users = Depends(check_user_authentication),
    sources_service: AudienceSourceService = Depends(get_audience_sources_service),
):
    return sources_service.get_filtered_sources(name=name, source=source, type_customer=type_customer, domain_id=domain_id, created_date=created_date, user_id=user.get("id"))