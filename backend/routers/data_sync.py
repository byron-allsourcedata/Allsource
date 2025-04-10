from fastapi import APIRouter, Depends, Query, HTTPException, status
from dependencies import get_integration_service, get_audience_smarts_service, IntegrationService, check_domain, check_user_authorization, check_user_authentication 
from schemas.integrations.integrations import *
from services.audience_smarts import AudienceSmartsService
from enums import TeamAccessLevel, BaseEnum
from starlette.responses import StreamingResponse

router = APIRouter(dependencies=[Depends(check_user_authorization)])

@router.get('/sync')
async def get_sync(service_name: str | None = Query(None), integrations_users_sync_id: int | None = Query(None),
                   integration_service: IntegrationService = Depends(get_integration_service),
                   domain=Depends(check_domain)):
    return integration_service.get_sync_domain(domain.id, service_name, integrations_users_sync_id)


@router.get('/get-smart-audience-sync')
async def get_smart_sync(service_name: str | None = Query(None), integrations_users_sync_id: int | None = Query(None),
                         integration_service: IntegrationService = Depends(get_integration_service),
                         user=Depends(check_user_authorization)):
    return integration_service.get_all_audience_sync(user, service_name, integrations_users_sync_id)


@router.delete('/delete-smart-audience-sync')
async def delete_smart_sync(list_id: str = Query(...),
                            integration_service: IntegrationService = Depends(get_integration_service),
                            user=Depends(check_user_authorization)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value, TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    return integration_service.delete_smart_sync(user, list_id)


@router.post('/sync/switch-toggle-smart-audience-sync')
async def switch_toggle(data: SyncRequest,
                        integration_service: IntegrationService = Depends(get_integration_service),
                        user=Depends(check_user_authorization)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value, TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    return integration_service.switch_toggle_smart_sync(user=user, list_id=data.list_id)


@router.post('/sync')
async def create_sync(data: SyncCreate, service_name: str = Query(...),
                      integration_service: IntegrationService = Depends(get_integration_service),
                      user=Depends(check_user_authorization), domain = Depends(check_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value, TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    data = {k: v for k, v in data.model_dump().items() if v}
    with integration_service as service:
        service = getattr(service, service_name.lower())
        await service.create_sync(
            **data,
            domain_id=domain.id,
            created_by=user.get('full_name'),
            user=user
        )

@router.post('/create-smart-audience-sync')
def create_smart_audience_sync(
    data: SmartAudienceSyncCreate, 
    service_name: str = Query(...),
    integration_service: IntegrationService = Depends(get_integration_service),
    user=Depends(check_user_authorization)
):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value, TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    data = {k: v for k, v in data.model_dump().items() if v}
    with integration_service as service:
        service = getattr(service, service_name.lower())
        service.create_smart_audience_sync(
            **data,
            created_by=user.get('full_name'),
            user=user
        )
        
@router.delete('/sync')
async def delete_sync(list_id: str = Query(...), 
                      service_name: str | None = Query(None),
                      integration_service: IntegrationService = Depends(get_integration_service),
                      user = Depends(check_user_authorization), domain = Depends(check_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value, TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    return integration_service.delete_sync_domain(domain.id, list_id)

@router.post('/sync/switch-toggle')
async def switch_toggle(data: SyncCreate,
                        service_name: str | None = Query(None),
                        integration_service: IntegrationService = Depends(get_integration_service),
                        user = Depends(check_user_authorization), domain = Depends(check_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value, TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    return integration_service.switch_sync_toggle(domain.id, data.list_id)

@router.put('/sync')
async def edit_sync(data: SyncCreate,
                      service_name: str | None = Query(None),
                      integration_service: IntegrationService = Depends(get_integration_service),
                      user=Depends(check_user_authorization), domain=Depends(check_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value, TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    data = {k: v for k, v in data.model_dump().items() if v}
    with integration_service as service:
        service = getattr(service, service_name.lower())
        service.edit_sync(
            **data,
            domain_id=domain.id,
            user_id=user.get('id'),
            created_by=user.get('full_name'),
        )

@router.get('/sync/tags')
async def get_tags(service_name: str = Query(...),
                   integration_service: IntegrationService = Depends(get_integration_service),
                   user = Depends(check_user_authentication), domain = Depends(check_domain)):
    with integration_service as service:
        service = getattr(service, service_name.lower())
        return service.get_tags(domain.id, user)

@router.post('/sync/tags')
async def create_tag(tag_data: CreateListOrTags,
                      service_name: str = Query(...),
                      integrations_service: IntegrationService = Depends(get_integration_service),
                      user = Depends(check_user_authorization), domain = Depends(check_domain)):
    with integrations_service as service:
        service = getattr(service, service_name)
        return service.create_tags(tag_data.name, domain.id, user)

@router.post('/download-persons')
def download_persons(
        id: int = Query(...),
        audience_smarts_service: AudienceSmartsService = Depends(get_audience_smarts_service),
):
    result = audience_smarts_service.download_synced_persons(
        data_sync_id=id
        )
    
    if result:
        return StreamingResponse(result, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=data.csv"})
    return BaseEnum.FAILURE