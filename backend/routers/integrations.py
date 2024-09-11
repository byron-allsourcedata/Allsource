from fastapi import APIRouter, Depends, Query, HTTPException
from dependencies import get_integration_service, IntegrationService, IntegrationsPresistence, get_integration_service, get_user_integrations_presistence
from schemas.integrations.integrations import IntegrationCredentials, ExportLeads, SyncCreate
from dependencies import check_user_authentication

router = APIRouter(prefix='/integrations', tags=['Integrations'])

@router.get('/')
async def get_integrations_service(persistence: IntegrationsPresistence = Depends(get_user_integrations_presistence),):
    return persistence.get_integrations_service()
    

@router.get('/credentials/')
async def get_integrations_credentials(integration_serivce: IntegrationService = Depends(get_integration_service), 
                                       user = Depends(check_user_authentication)):
    integration = integration_serivce.get_user_service_credentials(user)
    return integration


@router.post('/export/')
async def export(export_query: ExportLeads, service_name: str = Query(...),
                 integrations_service: IntegrationService = Depends(get_integration_service),
                 user = Depends(check_user_authentication)):
    with integrations_service as service: 
        service = getattr(service, service_name)
        service.export_leads(export_query.list_name, user['id'])
        return {'message': 'Successfuly'}


@router.post('/', status_code=200)
async def create_integration(creditional: IntegrationCredentials, service_name: str = Query(...), 
                             integration_service: IntegrationService = Depends(get_integration_service),
                             user = Depends(check_user_authentication)):
    with integration_service as service:
        service = getattr(service, service_name.lower())
        if not service:
            raise HTTPException(status_code=404, detail=f'Service {service_name} not found') 
        service.add_integration(user, creditional)
        return {'message': 'Successfuly'}
    

@router.delete('/')
async def delete_integration(service_name: str = Query(...),
                             user = Depends(check_user_authentication),
                             integration_service: IntegrationService = Depends(get_integration_service)):
    try:
        integration_service.delete_integration(service_name, user)
        return {'message': 'Successfuly'}
    except:
        raise HTTPException(status_code=400)
    
@router.get('/sync/')
async def get_sync(integration_service: IntegrationService = Depends(get_integration_service),
                   user = Depends(check_user_authentication)):
    return integration_service.get_sync_user(user['id'])


@router.get('/sync/list/')
async def get_list(service_name: str = Query(...), 
                   integration_service: IntegrationService = Depends(get_integration_service),
                   user = Depends(check_user_authentication)):
    with integration_service as service:
        service = getattr(service, service_name)
        return service.get_list(user)

@router.post('/sync/', status_code=201)
async def create_sync(data: SyncCreate, service_name: str = Query(...),
                      integration_service: IntegrationService = Depends(get_integration_service),
                      user = Depends(check_user_authentication)):
    with integration_service as service:
        service = getattr(service, service_name)
        service.create_sync(user['id'], **data.model_dump())
