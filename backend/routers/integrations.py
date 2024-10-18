from fastapi import APIRouter, Depends, Query, HTTPException, status
from enums import UserAuthorizationStatus
from dependencies import get_integration_service, IntegrationService, IntegrationsPresistence, get_user_integrations_presistence, \
    check_user_authorization, check_domain, check_pixel_install_domain, check_user_authentication
from schemas.integrations.integrations import *
from enums import TeamAccessLevel

router = APIRouter()

@router.get('')
async def get_integrations_service(type: str | None = Query(None), data_sync: bool | None = Query(None),persistence: IntegrationsPresistence = Depends(get_user_integrations_presistence)):
    filter = {}
    if type:
        filter['type'] = type 
    if data_sync is not None:
        filter['data_sync'] = data_sync  
    return persistence.get_integrations_service(**filter)
    

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
        service = getattr(service, platform.lower())
        return service.get_credentials(domain.id)

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
        service.add_integration(user=user, credentials=creditional, domain=domain)
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
    

@router.get('/sync/list/')
async def get_list(service_name: str = Query(...), 
                   integration_service: IntegrationService = Depends(get_integration_service),
                   user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)):
    with integration_service as service:
        service = getattr(service, service_name.lower())
        return service.get_list(domain.id)

@router.post('/sync/list/', status_code=201)
async def create_list(list_data: CreateListOrTags,
                      service_name: str = Query(...),
                      integrations_service: IntegrationService = Depends(get_integration_service),
                      user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)):
    with integrations_service as service:
        service = getattr(service, service_name)
        return service.create_list(list_data.name, domain.id)


@router.post('/suppression/')
async def set_suppression(suppression_data: SupperssionSet, service_name: str = Query(...),
                          integration_service: IntegrationService = Depends(get_integration_service),
                          user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.team_access_level != TeamAccessLevel.ADMIN or team_member.team_access_level != TeamAccessLevel.STANDARD:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    with integration_service as service: 
        service.klaviyo.set_suppression()
        service = getattr(service, service_name)
        return service.set_supperssions(suppression_data.suppression, domain.id)
        
