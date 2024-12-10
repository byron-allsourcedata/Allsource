from datetime import datetime, timedelta
import json
from urllib.parse import quote, urlencode
from fastapi import APIRouter, Depends, Query, HTTPException, status, Body, Request
from fastapi.responses import RedirectResponse
from enums import UserAuthorizationStatus
from dependencies import get_integration_service, IntegrationService, IntegrationsPresistence, \
            get_user_integrations_presistence, check_user_authorization, check_domain, \
            check_pixel_install_domain, check_user_authentication, get_user_persistence_service, \
            UserPersistence, get_user_domain_persistence, UserDomainsPersistence, check_api_key
from schemas.integrations.integrations import *
from enums import TeamAccessLevel
from schemas.integrations.shopify import ShopifyLandingResponse
import httpx
from config.bigcommerce import BigcommerceConfig


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
        service.add_integration(creditional, domain=domain, user_id=user.get('id'))
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
        integration_service.delete_integration(service_name, domain)
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


@router.get("/bigcommerce/oauth")
async def bigcommerce_redirect_login(store_hash: str = Query(...), is_pixel_install: bool = Query(False), user = Depends(check_user_authentication), domain = Depends(check_domain)):
    # scope = ['store_v2_orders_read_only', 'store_v2_content', 'store_v2_information_read_only']

    params = {
        "client_id": BigcommerceConfig.client_id,
        'context': f'stores/{store_hash}',
        "redirect_uri": BigcommerceConfig.redirect_uri,
        "response_type": "code",
        "scope": "store_content_checkout store_v2_content store_v2_default store_v2_information_read_only store_v2_orders_read_only",
        'state': f'{user.get("id")}:{domain.id}:{is_pixel_install}'
    }
    query_string = urlencode(params, safe=':/')

    authorize_url = f"https://login.bigcommerce.com/oauth2/authorize?{query_string}"
    return {
        'url': authorize_url
    }

@router.get('/bigcommerce/oauth/callback')
async def bigcommerce_oauth_callback(code: str, state: str = Query(None), integration_service: IntegrationService = Depends(get_integration_service),
                                     user_persistence: UserPersistence = Depends(get_user_persistence_service), domain_persistence: UserDomainsPersistence = Depends(get_user_domain_persistence)):
    status_oauth = False
    payload = {
        'client_id': BigcommerceConfig.client_id,
        'client_secret': BigcommerceConfig.client_secret,
        'code': code,
        'redirect_uri': BigcommerceConfig.redirect_uri,
        'grant_type': 'authorization_code'
    }
    with httpx.Client() as client:
        response = client.post(BigcommerceConfig.token_url, data=payload)
        if response.status_code == 200:
            status_oauth = True
            shop_hash = response.json().get('context').split('/')[1]
            access_token = response.json().get('access_token')
    if state:
        parts = state.split(':')
        user_id = parts[0] if len(parts) > 0 else None
        domain_id = parts[1] if len(parts) > 1 else None
        is_pixell_install = parts[2] if len(parts) > 2 else None
    else:
        user_id, domain_id, is_pixell_install = None, None, None
    if status_oauth:
        if state:
            url = BigcommerceConfig.frontend_dashboard_redirect if is_pixell_install else BigcommerceConfig.frontend_redirect
            user = user_persistence.get_user_by_id(user_id)
            domain = domain_persistence.get_domain_by_filter(id=domain_id)
            domain = domain[0] if domain else None
            if not domain:
                return RedirectResponse(f'{url}?message=Failed')
            try:
                with integration_service as service:
                    service.bigcommerce.add_integration_with_app(new_credentials=IntegrationCredentials(
                        bigcommerce=ShopifyOrBigcommerceCredentials(
                            shop_domain=shop_hash,
                            access_token=access_token
                        )
                    ), domain=domain, user=user)
                return RedirectResponse(f'{url}?message=Successfully')
            except:
                return RedirectResponse(f'{url}?message=Failed')
        with integration_service as service:
            eai = service.bigcommerce.add_external_apps_install(new_credentials=IntegrationCredentials(
                        bigcommerce=ShopifyOrBigcommerceCredentials(
                            shop_domain=shop_hash,
                            access_token=access_token
                        )))
            return RedirectResponse(BigcommerceConfig.external_app_installed)

@router.get('/eai')
async def get_eais_platform(platform: str = Query(...), integration_service: IntegrationService = Depends(get_integration_service), user = Depends(check_user_authorization)):
    return integration_service.get_external(platform)
    

@router.get('/zapier')
async def auth(domain = Depends(check_api_key), integration_service: IntegrationService = Depends(get_integration_service)):
    with integration_service as service:
        return service.zapier.add_integrations(domain)
    

@router.post('/zapier/webhook', status_code=201)
async def subscribe_zapier_webhook(hook_data = Body(...), domain = Depends(check_api_key), integrations_service: IntegrationService = Depends(get_integration_service)):
    with integrations_service as service:
        return await service.zapier.create_data_sync(domain_id=domain.id, leads_type=hook_data.get('leads_type'), hook_url=hook_data.get('hookUrl')) 

@router.delete('/zapier/webhook')
async def unsubscribe_zapier_webhook(sync_data = Body(...), domain = Depends(check_api_key), integrations_service: IntegrationService = Depends(get_integration_service)):
    return integrations_service.delete_sync_domain(domain_id=domain.id, list_id=sync_data.get('sync_id'))

@router.get('/zapier/webhook')
async def get_dont_import_leads(domain = Depends(check_api_key)):
    with open('../backend/data/integrations/example_lead.json', 'r') as file:
        example_lead = file.read()
        return json.loads(example_lead)
    
@router.get('/shopify/install/redirect')
async def oauth_shopify_install_redirect(shop: str, r: Request, integrations_service: IntegrationService = Depends(get_integration_service)):
    try:
        with integrations_service as service:
            url = service.shopify.get_shopify_install_url(shop, r)
            return RedirectResponse(url = url)
    except Exception as e:
        raise HTTPException(status_code=500, detail='Something went wrong')
    
@router.post('/shopify/uninstall')
async def shopify_app_uninstalled_webhook(request: Request, integrations_service: IntegrationService = Depends(get_integration_service)):
    with integrations_service as service:
        payload = await request.json()
        print('----------')
        print(payload)
        return service.shopify.handle_uninstalled_app(payload)
    
    
@router.get("/shopify/landing", response_model=ShopifyLandingResponse)
def oauth_shopify_callback(shop: str, r: Request, integrations_service: IntegrationService = Depends(get_integration_service)):
    with integrations_service as service:
        result = service.shopify.oauth_shopify_callback(shop, r)
        return ShopifyLandingResponse(token=result.get('token'), message=result.get('message'))
    