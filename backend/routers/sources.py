from fastapi import APIRouter, Depends, Query
from dependencies import get_audience_sources_service, check_user_authorization
from services.audience_sources import AudienceSourceService
from schemas.audience import HeadingSubstitutionRequest, NewSource, SourcesObjectResponse, SourceResponse
from uuid import UUID
from typing import Optional, List

router = APIRouter(dependencies=[Depends(check_user_authorization)])

@router.get("", response_model=SourcesObjectResponse)
def get_sources(
        user=Depends(check_user_authorization),
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(15, alias="per_page", ge=1, le=500, description="Items per page"),
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
    return sources_service.substitution_headings(payload.headings)


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