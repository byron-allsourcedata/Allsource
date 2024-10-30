from urllib.parse import urlencode
from fastapi import APIRouter, Depends, Query, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from enums import UserAuthorizationStatus
from dependencies import get_integration_service, IntegrationService, IntegrationsPresistence, \
    get_user_integrations_presistence, \
    check_user_authorization, check_domain, check_pixel_install_domain, check_user_authentication, get_user_persistence_service, UserPersistence, get_user_domain_persistence, UserDomainsPersistence
from schemas.integrations.integrations import *
from enums import TeamAccessLevel

router = APIRouter()


@router.get('')
@router.get('/')
async def get_integrations_service(type: str | None = Query(None), data_sync: bool | None = Query(None),
                                   persistence: IntegrationsPresistence = Depends(get_user_integrations_presistence)):
    filter = {}
    if type:
        filter['type'] = type
    if data_sync is not None:
        filter['data_sync'] = data_sync
    return persistence.get_integrations_service(**filter)


@router.get('/credentials/')
async def get_integrations_credentials(integration_serivce: IntegrationService = Depends(get_integration_service),
                                       user=Depends(check_user_authorization),
                                       domain=Depends(check_pixel_install_domain)):
    integration = integration_serivce.get_user_service_credentials(domain.id)
    return integration


@router.get('/credentials/{platform}')
async def get_credential_service(platform: str,
                                 integration_service: IntegrationService = Depends(get_integration_service),
                                 user=Depends(check_user_authorization), domain=Depends(check_pixel_install_domain)
                                 ):
    with integration_service as service:
        service = getattr(service, platform.lower())
        return service.get_credentials(domain.id)


@router.post('/export/')
async def export(export_query: ExportLeads, service_name: str = Query(...),
                 integrations_service: IntegrationService = Depends(get_integration_service),
                 user=Depends(check_user_authorization), domain=Depends(check_pixel_install_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value,
                                                        TeamAccessLevel.STANDARD.value}:
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
                             user=Depends(check_user_authentication), domain=Depends(check_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value,
                                                        TeamAccessLevel.STANDARD.value}:
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
        service.add_integration(creditional, domain=domain, user=user)
        return {'message': 'Successfuly'}


@router.delete('/')
async def delete_integration(service_name: str = Query(...),
                             user=Depends(check_user_authorization),
                             integration_service: IntegrationService = Depends(get_integration_service),
                             domain=Depends(check_pixel_install_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value,
                                                        TeamAccessLevel.STANDARD.value}:
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
async def get_list(ad_account_id: str = Query(None),
                   service_name: str = Query(...),
                   integration_service: IntegrationService = Depends(get_integration_service),
                   user=Depends(check_user_authorization), domain=Depends(check_pixel_install_domain)):
    with integration_service as service:
        service = getattr(service, service_name.lower())
        _ = {'domain_id': domain.id}
        if ad_account_id:
            _['ad_account_id'] = ad_account_id
        return service.get_list(**_)


@router.post('/sync/list/', status_code=201)
async def create_list(list_data: CreateListOrTags,
                      service_name: str = Query(...),
                      integrations_service: IntegrationService = Depends(get_integration_service),
                      user=Depends(check_user_authorization), domain=Depends(check_pixel_install_domain)):
    with integrations_service as service:
        service = getattr(service, service_name)
        return service.create_list(list_data, domain.id)
    
@router.get('/sync/sender', status_code=200)
async def get_sender(integrations_service: IntegrationService = Depends(get_integration_service), user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)):
    with integrations_service as service:
        return service.sendlane.get_sender(domain.id)


@router.get('/sync/ad_accounts')
async def get_ad_accounts(integration_service: IntegrationService = Depends(get_integration_service),
                          user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)):
    with integration_service as serivce:
        return serivce.meta.get_ad_accounts(domain.id)


@router.post('/suppression/')
async def set_suppression(suppression_data: SupperssionSet, service_name: str = Query(...),
                          integration_service: IntegrationService = Depends(get_integration_service),
                          user=Depends(check_user_authorization), domain=Depends(check_pixel_install_domain)):
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



from fastapi.responses import RedirectResponse, JSONResponse
import httpx

CLIENT_ID = '5at1jvto89a7yfkd1btao8o42sfid16'
CLIENT_SECRET = '24f5980e7398195fbf8e5f8b388e7adc2a0abca0e95011441d411d59d55137f0'
REDIRECT_URI = 'https://39e7-198-98-50-3.ngrok-free.app/api/integrations/bigcommerce/oauth/callback'
FRONTEND_REDIRECT_URI = 'http://localhost:3000/integrations'


@router.get("/bigcommerce/oauth")
async def bigcommerce_redirect_login(store_hash: str = Query(...), user = Depends(check_user_authorization), domain = Depends(check_pixel_install_domain)):
    scope = ['store_v2_orders_read_only','store_v2_content','store_content_checkout', 'store_v2_information_read_only']
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "context": f"stores/{store_hash}",
        "response_type": "code",
        "scope": ' '.join(scope),
        'state': f'{user.get("id")}:{domain.id}'
    }
    query_string = urlencode(params)
    authorize_url = f"https://login.bigcommerce.com/oauth2/authorize?{query_string}"    
    return {
        'url': authorize_url
    }

@router.get("/bigcommerce/oauth/callback")
async def bigcommerce_oauth_callback(code: str, state: str = Query(None), 
                                     integration_service: IntegrationService = Depends(get_integration_service), 
                                     user_persistence: UserPersistence = Depends(get_user_persistence_service),
                                     domain_persistence: UserDomainsPersistence = Depends(get_user_domain_persistence)):
    user_id, domain_id = state.split(':')
    user = user_persistence.get_user_by_id(user_id)
    domain = domain_persistence.get_domain_by_filter(id=domain_id)[0]
    token_url = "https://login.bigcommerce.com/oauth2/token"
    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    response =  httpx.Client().post(token_url, data=payload)
    if response.status_code == 200:
        with integration_service as service:
            token_data = response.json()
            shop_hash = token_data.get('context').split('/')[1]
            access_token = token_data.get('access_token')

            with integration_service as service:
                try:
                    service.bigcommerce.add_integration(
                    new_credentials=IntegrationCredentials(
                        bigcommerce=ShopifyOrBigcommerceCredentials(
                            shop_domain=shop_hash,
                            access_token=access_token
                        )
                    ),
                    user=user,
                    domain=domain
                )
                except:  return RedirectResponse(url=f'{FRONTEND_REDIRECT_URI}?message=Failed')
        return RedirectResponse(url=f'{FRONTEND_REDIRECT_URI}?message=Successfuly')
    else:
        return RedirectResponse(url=f'{FRONTEND_REDIRECT_URI}?message=Failed')