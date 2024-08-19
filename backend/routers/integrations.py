from fastapi import APIRouter, Depends, Query, HTTPException
from dependencies import get_integration_service, IntegrationService
from schemas.integrations import IntegrationCredentials


router = APIRouter(prefix='/integrations', tags=['Integrations'])

@router.get('/')
async def get_integrations_service():
    return [
    {
        'id': 1,
        'service_name': 'shopify',
        'image_url': 'https://jungleworks.com/wp-content/uploads/2022/03/1.png',
    },
    {
        'id': 2,
        'service_name': 'bigcommerce',
        'image_url': 'https://taplink.st/a/6/2/c/e/acf46f.jpg?1',
    }]

@router.get('/credentials')
async def get_integrations_credentials(integration_serivce: IntegrationService = Depends(get_integration_service)):
    integration = integration_serivce.get_user_service_credentials()
    if not integration:
        raise HTTPException(status_code=404, detail='don`t have integrations')
    return integration


@router.post('/', status_code=201)
async def create_integration(creditional: IntegrationCredentials, service_name: str = Query(...), 
                             integration_service: IntegrationService = Depends(get_integration_service)):
    with integration_service as service:
        service = getattr(service, service_name)
        if not service:
            raise HTTPException(status_code=404, detail=f'Service {service_name} not found') 
        integration = service.create_integration(**creditional.__dict__[service_name].__dict__)
        if not integration:
            raise HTTPException(status_code=400)
        integration_service.save_customers(integration)
        return {'message': 'Successfuly'}
    

@router.delete('/')
async def delete_integration(service_name: str = Query(...),
                             integration_service: IntegrationService = Depends(get_integration_service)):
    try:
        integration_service.delete_integration(service_name)
        return {'message': 'Successfuly'}
    except:
        raise HTTPException(status_code=400)