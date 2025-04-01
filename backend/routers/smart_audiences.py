from fastapi import APIRouter, Depends, Query, Body, HTTPException
from dependencies import get_audience_smarts_service, check_user_authorization_without_pixel
from services.audience_smarts import AudienceSmartsService
from schemas.audience import SmartsAudienceObjectResponse, UpdateSmartAudienceRequest, CreateSmartAudienceRequest, DataSourcesResponse
from typing import Optional, List
from uuid import UUID

router = APIRouter(dependencies=[Depends(check_user_authorization_without_pixel)])

@router.get("", response_model=SmartsAudienceObjectResponse)
def get_audience_smarts(
        user=Depends(check_user_authorization_without_pixel),
        page: int = Query(1, alias="page", ge=1),
        per_page: int = Query(10, alias="per_page", ge=1, le=500),
        sort_by: str = Query(None),
        sort_order: str = Query(None),
        from_date: int = Query(None),
        to_date: int = Query(None),
        search_query: Optional[str] = Query(None),
        statuses: List[str] = Query([]),
        use_cases: List[str] = Query([]),
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service)
):
    smarts_audience_list, count = audience_smarts_service.get_audience_smarts(
        user=user,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page,
        from_date=from_date,
        to_date=to_date,
        search_query=search_query,
        statuses=statuses,
        use_cases=use_cases
    )

    return {
        "audience_smarts_list": smarts_audience_list,
        "count": count
    }


@router.post("/calculate")
def calculate_smart_audience(
    request = Body(...),
    audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service)
):
    return audience_smarts_service.calculate_smart_audience(
        request=request
    )

@router.get("/{id}/data-sources", response_model=DataSourcesResponse)
def get_datasource_by_id(
        id: UUID,
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service)
):
        data_sources = audience_smarts_service.get_datasources_by_aud_smart_id(
            id=id,
        )
        return data_sources


@router.post("/builder")
async def create_smart_audience(
        request: CreateSmartAudienceRequest,
        user=Depends(check_user_authorization_without_pixel),
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service)
):
    try:
        if user.get('team_member'):
            user_id = user.get('team_member').get('id')
        else:
            user_id = user.get('id')

        new_audience = await audience_smarts_service.create_audience_smart(
            name=request.smart_audience_name,
            user=user,
            created_by_user_id=user_id,
            use_case_alias=request.use_case,
            validation_params=request.validation_params,
            data_sources=request.data_sources,
            contacts_to_validate=request.contacts_to_validate
        )
        return {'status': "SUCCESS"}
    except ValueError:
        raise HTTPException(status_code=400)


@router.get("/get-datasource")
def get_datasource(
        user=Depends(check_user_authorization_without_pixel),
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service)
):
        data_source = audience_smarts_service.get_datasource(
            user=user,
        )
        return data_source



@router.get("/search")
def search_audience_smart(
        start_letter: str = Query(..., min_length=3),
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service),
        user: dict = Depends(check_user_authorization_without_pixel)
):
    return audience_smarts_service.search_audience_smart(start_letter, user=user)


@router.delete("/{id}", response_model=bool)
def delete_audience_smart(
        id: UUID,
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service)
):
    return audience_smarts_service.delete_audience_smart(
        id=id
    )


@router.put("/{id}")
def update_audience_smart(
        id: UUID,
        payload: UpdateSmartAudienceRequest,
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service),
):
    return audience_smarts_service.update_audience_smart(
        id=id, new_name=payload.new_name
    )