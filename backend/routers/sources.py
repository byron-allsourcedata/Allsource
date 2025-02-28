from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from dependencies import get_audience_sources_service, check_user_authorization
from services.audience_sources import AudienceSourceService
from schemas.audience import HeadingSubstitutionRequest

router = APIRouter(dependencies=[Depends(check_user_authorization)])

@router.get("")
def get_sources(
        user=Depends(check_user_authorization),
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        per_page: int = Query(15, alias="per_page", ge=1, le=500, description="Items per page"),
        sort_by: str = Query(None, description="Field"),
        sort_order: str = Query(None, description="Field to sort by: 'asc' or 'desc'"),
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return sources_service.get_sources(
        user=user,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page,
    )


@router.post("/heading-substitution")
def substitution_headings(
        payload: HeadingSubstitutionRequest,
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return sources_service.substitution_headings(payload.headings)


@router.post("/create")
async def create_source(
        user=Depends(check_user_authorization),
        source_type: str = Form(...),
        source_origin: str = Form(...),
        source_name: str = Form(...),
        file: UploadFile = File(None),
        file_name: str = Form(None),
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return await sources_service.create_source(
        user=user,
        source_type=source_type,
        source_origin=source_origin,
        source_name=source_name,
        file=file,
        file_name=file_name,
    )


@router.delete("/{id}")
def delete_source(
        id: int,
        sources_service: AudienceSourceService = Depends(get_audience_sources_service)
):
    return sources_service.delete_source(
        id=id
    )