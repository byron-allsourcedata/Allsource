from fastapi import APIRouter, Depends, Query, HTTPException
from dependencies import get_integration_service, IntegrationService, IntegrationsPresistence, get_integrations_presistence
from schemas.integrations.integrations import IntegrationCredentials, ExportLeads
from dependencies import check_user_authentication, User

router = APIRouter(prefix='/integrations', tags=['Integrations'])

@router.get('/')
async def get_integrations_service(persistence: IntegrationsPresistence = Depends(get_integrations_presistence),):
    return persistence.get_integrations_service()
    

@router.get('/credentials')
async def get_integrations_credentials(integration_serivce: IntegrationService = Depends(get_integration_service), 
                                       user = Depends(check_user_authentication)):
    integration = integration_serivce.get_user_service_credentials(user)
    if not integration:
        raise HTTPException(status_code=404, detail='don`t have integrations')
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
        service = getattr(service, service_name)
        if not service:
            raise HTTPException(status_code=404, detail=f'Service {service_name} not found') 
        service.create_integration(user, **creditional.__dict__[service_name].__dict__)
        return {'message': 'Successfuly'}
    

@router.delete('/')
async def delete_integration(service_name: str = Query(...),
                             integration_service: IntegrationService = Depends(get_integration_service)):
    try:
        integration_service.delete_integration(service_name)
        return {'message': 'Successfuly'}
    except:
        raise HTTPException(status_code=400)


