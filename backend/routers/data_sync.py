from fastapi import APIRouter, Depends, Query, HTTPException, status
from dependencies import get_integration_service, IntegrationService, check_domain, check_user_authorization, check_pixel_install_domain, check_user_authentication
from schemas.integrations.integrations import *
from enums import TeamAccessLevel

router = APIRouter()


@router.get('/sync')
async def get_sync(service_name: str | None = Query(None), integrations_users_sync_id: int | None = Query(None),
                    integration_service: IntegrationService = Depends(get_integration_service),
                   user = Depends(check_user_authorization), domain = Depends(check_domain)):
    return integration_service.get_sync_domain(domain.id, service_name, integrations_users_sync_id)


@router.post('/sync')
async def create_sync(data: SyncCreate, service_name: str = Query(...),
                      integration_service: IntegrationService = Depends(get_integration_service),
                      user = Depends(check_user_authorization), domain = Depends(check_domain)):
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
            created_by=user.get('full_name'),
        )

@router.get('/sync/tags')
async def get_tags(service_name: str = Query(...),
                   integration_service: IntegrationService = Depends(get_integration_service),
                   user = Depends(check_user_authentication), domain = Depends(check_domain)):
    with integration_service as service:
        service = getattr(service, service_name.lower())
        return service.get_tags(domain.id)

@router.post('/sync/tags')
async def create_tag(tag_data: CreateListOrTags,
                      service_name: str = Query(...),
                      integrations_service: IntegrationService = Depends(get_integration_service),
                      user = Depends(check_user_authorization), domain = Depends(check_domain)):
    with integrations_service as service:
        service = getattr(service, service_name)
        return service.create_tags(tag_data.name, domain.id)