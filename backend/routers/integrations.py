from fastapi import APIRouter, Depends, Query, HTTPException, status
from enums import UserAuthorizationStatus
from dependencies import get_integration_service, IntegrationService, IntegrationsPresistence, get_integration_service, get_user_integrations_presistence, \
    check_user_authorization, check_domain, check_pixel_install_domain, check_user_authentication
from schemas.integrations.integrations import IntegrationCredentials, ExportLeads, SyncCreate
from enums import TeamAccessLevel

router = APIRouter(prefix='/integrations', tags=['Integrations'])

@router.get('/')
async def get_integrations_service(persistence: IntegrationsPresistence = Depends(get_user_integrations_presistence)):
    return persistence.get_integrations_service()
    

@router.get('/credentials/')
async def get_integrations_credentials(integration_serivce: IntegrationService = Depends(get_integration_service), 
                                       user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)):
    integration = integration_serivce.get_user_service_credentials(domain.id)
    return integration

@router.get('/credentials/{platform}')
async def get_credential_service(platform: str, 
                                 integration_service: IntegrationService = Depends(get_integration_service),
                                 user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)
                                 ):
    with integration_service as service:
        service = getattr(service, platform)
        return service.get_credentials(user['id'])

@router.post('/export/')
async def export(export_query: ExportLeads, service_name: str = Query(...),
                 integrations_service: IntegrationService = Depends(get_integration_service),
                 user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value, TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    with integrations_service as service: 
        service = getattr(service, service_name)
        service.export_leads(export_query.list_name, user['id'])
        return {'message': 'Successfuly'}


@router.post('/', status_code=200)
async def create_integration(creditional: IntegrationCredentials, service_name: str = Query(...), 
                             integration_service: IntegrationService = Depends(get_integration_service),
                             user = Depends(check_user_authentication), domain = Depends(check_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value, TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    if not creditional.pixel_install and not domain.is_pixel_installed:
        raise HTTPException(status_code=403, detail={'status': UserAuthorizationStatus.PIXEL_INSTALLATION_NEEDED.value})
    with integration_service as service:
        service = getattr(service, service_name.lower())
        if not service:
            raise HTTPException(status_code=404, detail=f'Service {service_name} not found') 
        service.add_integration(user, domain, creditional)
        return {'message': 'Successfuly'}
    

@router.delete('/')
async def delete_integration(service_name: str = Query(...),
                             user = Depends(check_user_authorization),
                             integration_service: IntegrationService = Depends(get_integration_service), domain = Depends(check_pixel_install_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value, TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    try:
        integration_service.delete_integration(service_name, user)
        return {'message': 'Successfuly'}
    except:
        raise HTTPException(status_code=400)
    
@router.get('/sync/')
async def get_sync(integration_service: IntegrationService = Depends(get_integration_service),
                   user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)):
    return integration_service.get_sync_user(user['id'])


@router.get('/sync/list/')
async def get_list(service_name: str = Query(...), 
                   integration_service: IntegrationService = Depends(get_integration_service),
                   user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)):
    with integration_service as service:
        service = getattr(service, service_name)
        return service.get_list(user)


@router.post('/sync/', status_code=201)
async def create_sync(data: SyncCreate, service_name: str = Query(...),
                      integration_service: IntegrationService = Depends(get_integration_service),
                      user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value, TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    with integration_service as service:
        service = getattr(service, service_name)
        service.create_sync(user['id'], **data.model_dump())

