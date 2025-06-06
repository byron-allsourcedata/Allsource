import hashlib
import json
import logging
import os

import httpx
from fastapi import APIRouter, Depends, Query, HTTPException, status, Body, Request
from fastapi.responses import RedirectResponse
from typing_extensions import Annotated

from config.bigcommerce import BigcommerceConfig
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from dependencies import (
    get_integration_service, IntegrationService, IntegrationsPresistence,
    get_user_integrations_presistence, check_user_authorization, check_domain, check_user_authorization_without_pixel,
    check_pixel_install_domain, check_user_authentication, UserPersistence, get_user_domain_persistence,
    UserDomainsPersistence, check_api_key, get_settings_persistence
)
from enums import CreateDataSync, TeamAccessLevel
from persistence.domains import UserDomains
from persistence.settings_persistence import SettingsPersistence
from schemas.integrations.integrations import *
from schemas.integrations.shopify import ShopifyLandingResponse, GenericEcommerceResponse

router = APIRouter()


@router.get('')
@router.get('/')
async def get_integrations_service(type: str | None = Query(None), data_sync: bool | None = Query(None), user=Depends(check_user_authentication),
                                   persistence: IntegrationsPresistence = Depends(get_user_integrations_presistence)):
    filter = {}
    if type:
        filter['type'] = type
    if data_sync is not None:
        filter['data_sync'] = data_sync
        
    source_platform = user.get('source_platform')
    if source_platform in ['big_commerce', 'shopify']:
        filter['service_name'] = ['klaviyo', 'omnisend', 'mailchimp']
        
    return persistence.get_integrations_service(**filter)


@router.get('/smart-audience-sync')
@router.get('/smart-audience-sync/')
async def get_integrations_smart_audinece_sync(
        type: str | None = Query(None), 
        data_sync: bool | None = Query(None), 
        integration_list: str | None = Query(None),
        user=Depends(check_user_authentication),
        persistence: IntegrationsPresistence = Depends(get_user_integrations_presistence)
    ):
    filter = {}
    if type:
        filter['type'] = type
    if data_sync is not None:
        filter['data_sync'] = data_sync
    
    if integration_list:
        filter['service_name'] = integration_list.split(',')

    return persistence.get_integrations_service(**filter)


@router.get('/credentials/')
async def get_integrations_credentials(integration_serivce: IntegrationService = Depends(get_integration_service),
                                       user=Depends(check_user_authorization_without_pixel),
                                       domain=Depends(check_domain)):
    return integration_serivce.get_user_service_credentials(domain=domain, user=user)


@router.get('/credentials/{platform}')
async def get_credential_service(platform: str,
                                 integration_service: IntegrationService = Depends(get_integration_service),
                                 user=Depends(check_user_authorization), domain: UserDomains = Depends(check_domain)):
    with integration_service as service:
        service = getattr(service, platform.lower())
        domain_id = None if domain is None else domain.id
        return service.get_credentials(domain_id)

@router.get('/check-limit-reached', status_code=200)
async def check_limit_reached(integration_service: IntegrationService = Depends(get_integration_service),
                             user=Depends(check_user_authentication), domain=Depends(check_domain)):
    return integration_service.is_integration_limit_reached(user, domain)

@router.post('/', status_code=200)
async def create_integration(credentials: IntegrationCredentials, service_name: str = Query(...),
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
    # if integration_service.is_integration_limit_reached(user, domain):
    #         raise HTTPException(status_code=403, detail={'status': SubscriptionStatus.NEED_UPGRADE_PLAN.value})
    
    with integration_service as service:
        service = getattr(service, service_name.lower())
        if not service:
            raise HTTPException(status_code=404, detail=f'Service {service_name} not found')
        return service.add_integration(credentials=credentials, domain=domain, user=user)
    
@router.post('/connect', status_code=200)
async def connect_integration(credentials: IntegrationCredentials, service_name: str = Query(...),
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

    with integration_service as service:
        service = getattr(service, service_name.lower())
        if not service:
            raise HTTPException(status_code=404, detail=f'Service {service_name} not found')
        return service.connect_integration(credentials=credentials, domain=domain, user=user)

@router.delete('/')
async def delete_integration(service_name: str = Query(...),
                             user=Depends(check_user_authentication),
                             integration_service: IntegrationService = Depends(get_integration_service),
                             domain=Depends(check_domain)):
    if user.get('team_member'):
        team_member = user.get('team_member')
        if team_member.get('team_access_level') not in {TeamAccessLevel.ADMIN.value, TeamAccessLevel.OWNER.value,
                                                        TeamAccessLevel.STANDARD.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins and standard only."
            )
    try:
        integration_service.delete_integration(service_name, domain, user)
        return {'message': 'Successfuly'}
    except:
        raise HTTPException(status_code=400)


@router.get('/sync/list/')
async def get_list(ad_account_id: str = Query(None),
                   service_name: str = Query(...),
                   integration_service: IntegrationService = Depends(get_integration_service),
                   user=Depends(check_user_authorization), domain=Depends(check_domain)):
    with integration_service as service:
        params = {
            'domain_id': domain.id,
            'user_id': user.get('id')
        }
        if ad_account_id:
            params['ad_account_id'] = ad_account_id
        service = getattr(service, service_name.lower())
        
        return service.get_list(**params)


@router.post('/sync/list/', status_code=201)
async def create_list(list_data: CreateListOrTags,
                      service_name: str = Query(...),
                      integrations_service: IntegrationService = Depends(get_integration_service),
                      user=Depends(check_user_authorization), domain=Depends(check_domain)):
    with integrations_service as service:
        service = getattr(service, service_name)
        return service.create_list(list_data, domain.id, user.get('id'))

@router.post('/sync/campaign/', status_code=201)
async def create_campaign(list_data: CreateCampaign,
                      service_name: str = Query(...),
                      integrations_service: IntegrationService = Depends(get_integration_service),
                      user=Depends(check_user_authorization), domain=Depends(check_domain)):
    with integrations_service as service:
        service = getattr(service, service_name)
        return service.create_campaign(
            campaign_name=list_data.campaign_name,
            daily_budget=list_data.daily_budget,
            ad_account_id=list_data.ad_account_id,
            user_id=user.get('id')
        )
    
@router.get('/sync/sender', status_code=200)
async def get_sender(integrations_service: IntegrationService = Depends(get_integration_service), user = Depends(check_user_authorization), domain = Depends(check_domain)):
    with integrations_service as service:
        return service.sendlane.get_sender(domain.id, user.get('id'))


@router.get('/sync/ad_accounts')
async def get_ad_accounts(integration_service: IntegrationService = Depends(get_integration_service),
                            service_name: str = Query(...),
                            user = Depends(check_user_authorization), domain = Depends(check_domain)):

    with integration_service as service:
        service = getattr(service, service_name)
        return service.get_ad_accounts(domain.id, user.get('id'))

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
        service = getattr(service, service_name)
        return service.set_supperssions(suppression_data.suppression, domain.id, user)


@router.get("/bigcommerce/oauth")
async def bigcommerce_redirect_login(store_hash: str = Query(...), is_pixel_install: bool = Query(False), user = Depends(check_user_authentication), domain = Depends(check_domain), 
                                     integration_service: IntegrationService = Depends(get_integration_service)):
    
    with integration_service as service:
        return service.bigcommerce.bigcommerce_redirect_login(store_hash=store_hash, is_pixel_install=is_pixel_install, domain=domain, user=user)
    
@router.get("/bigcommerce/remove-user")
async def remove_user_callback(request: Request):
    params = request.query_params
    store_id = params.get('store_id')
    user_id = params.get('user_id')
    email = params.get('email')
    owner_email = params.get('owner_email')
    print(f"Store ID: {store_id}, User ID: {user_id}, Email: {email}, Owner Email: {owner_email}")

    return {"status": "success", "message": "User removed successfully"}
    
@router.get("/bigcommerce/auth/callback")
def bigcommerce_auth(
    code: Optional[str],
    user_persistence: UserPersistence,
    state: str = Query(None),
    integration_service: IntegrationService = Depends(get_integration_service),
    domain_persistence: UserDomainsPersistence = Depends(get_user_domain_persistence)
):
    
    payload = {
        'client_id': BigcommerceConfig.client_id,
        'client_secret': BigcommerceConfig.client_secret,
        'code': code,
        'redirect_uri': BigcommerceConfig.redirect_uri,
        'grant_type': 'authorization_code'
    }

    with httpx.Client() as client:
        token_response = client.post(BigcommerceConfig.token_url, data=payload)
        if token_response.status_code != 200:
            return "The pixel is not installed. Please visit https://allsourcedata.io and complete the integration there."

        token_data = token_response.json()

    access_token = token_data.get('access_token')
    shop_hash = token_data.get('context', '').split('/')[1]
    
    if state:
        user_id, domain_id, is_pixel_install = (state.split(':') + [None, None, None])[:3]
        redirect_url = BigcommerceConfig.frontend_get_started_redirect
    
        user = user_persistence.get_user_by_id(user_id)
        domain_entry = domain_persistence.get_domain_by_filter(id=domain_id)
        domain = domain_entry[0] if domain_entry else None
        
        if not domain:
            return RedirectResponse(f'{redirect_url}&install_bigcommerce=false')
        
        try:
            with integration_service as service:
                service.bigcommerce.add_integration_with_app(
                    new_credentials=IntegrationCredentials(
                        bigcommerce=ShopifyOrBigcommerceCredentials(
                            shop_domain=shop_hash,
                            access_token=access_token
                        )
                    ),
                    domain=domain,
                    user=user
                )
            return RedirectResponse(f'{redirect_url}?install_bigcommerce=true')
        except Exception:
            return RedirectResponse(f'{redirect_url}?install_bigcommerce=false')
    else:
        with httpx.Client() as client:
            shop_response = client.get(
                url=f"https://api.bigcommerce.com/stores/{shop_hash}/v2/store",
                headers={
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Auth-Token': access_token
                }
            )
            
            if shop_response.status_code != 200:
                return RedirectResponse(BigcommerceConfig.external_app_installed)

            shop_data = shop_response.json()
            domain_url = shop_data.get("domain")
        
        with integration_service as service:
                service.bigcommerce.add_external_apps_install(
                new_credentials=IntegrationCredentials(
                    bigcommerce=ShopifyOrBigcommerceCredentials(
                        shop_domain=shop_hash,
                        access_token=access_token
                    )
                ),
                domain_url=domain_url
            )
                 
    return RedirectResponse(f"{BigcommerceConfig.frontend_sign_up_redirect}?source_platform=big_commerce&shop_hash={shop_hash}")
    
@router.get("/bigcommerce/uninstall", status_code=status.HTTP_200_OK)
def oauth_bigcommerce_uninstall(signed_payload: Annotated[str, Query()], signed_payload_jwt: Annotated[str, Query()], integration_service: IntegrationService = Depends(get_integration_service)):
    with integration_service as service:
        return service.bigcommerce.oauth_bigcommerce_uninstall(signed_payload=signed_payload, signed_payload_jwt=signed_payload_jwt)

@router.get("/bigcommerce/load", status_code=status.HTTP_200_OK)
def oauth_bigcommerce_load(
    user_persistence: UserPersistence,
    signed_payload: Annotated[str, Query()],
    signed_payload_jwt: Annotated[str, Query()],
    integration_service: IntegrationService = Depends(get_integration_service),
    settings_persistence: SettingsPersistence = Depends(get_settings_persistence)
):
    with integration_service as service:
        result = service.bigcommerce.oauth_bigcommerce_load(signed_payload=signed_payload, signed_payload_jwt=signed_payload_jwt)
    
    user_email = result['user_email']
    store_hash = result['store_hash']
    owner_email = result['owner_email']
    user = user_persistence.get_user_by_email(user_email)
    if user:
        return RedirectResponse(BigcommerceConfig.frontend_sign_in_redirect)
    
    team_invitation = settings_persistence.get_team_invitation_by_email(user_email)
    if team_invitation:
        return RedirectResponse(f"{BigcommerceConfig.frontend_sign_up_redirect}?teams_token={team_invitation.token}&user_mail={user_email}")
    
    owner = integration_service.get_user_by_shop_domain(store_hash)
    if not owner:
        return RedirectResponse(f"{BigcommerceConfig.frontend_sign_up_redirect}?source_platform=big_commerce&shop_hash={store_hash}")
    
    if owner_email == user_email:
        return RedirectResponse(BigcommerceConfig.frontend_sign_in_redirect)
    
    md5_token_info = {
            'id': owner.id,
            'user_mail': user_email,
            'salt': os.getenv('SECRET_SALT')
        }
    json_string = json.dumps(md5_token_info, sort_keys=True)
    md5_hash = hashlib.md5(json_string.encode()).hexdigest()
    settings_persistence.save_pending_invations_by_userid(team_owner_id=owner.id, user_mail=user_email,
                                                                   invited_by_id=owner.id,
                                                                   access_level=TeamAccessLevel.STANDARD.value, md5_hash=md5_hash)
    
    return RedirectResponse(f"{BigcommerceConfig.frontend_sign_up_redirect}?teams_token={md5_hash}&user_mail={user_email}")

@router.get('/zapier')
async def auth(domain = Depends(check_api_key), integration_service: IntegrationService = Depends(get_integration_service)):
    with integration_service as service:
        return service.zapier.add_integrations(domain)
    

@router.post('/zapier/webhook', status_code=201)
async def subscribe_zapier_webhook(
    user_persistence: UserPersistence,
    hook_data = Body(...),
    domain = Depends(check_api_key),
    integrations_service: IntegrationService = Depends(get_integration_service),
):
    with integrations_service as service:
        
        user = user_persistence.get_user_by_id(domain.user_id)
        await service.zapier.create_data_sync(domain_id=domain.id, leads_type=hook_data.get('leadsType'), hook_url=hook_data.get('hookUrl'), list_name=hook_data.get('listName'), created_by=user.get('full_name'))
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        queue_name = f"sse_events_{str(user.get('id'))}"
        try:
            await publish_rabbitmq_message(
            connection=connection,
            queue_name=queue_name,
            message_body={'status': CreateDataSync.ZAPIER_CONNECTED.value}
            )
        except:
            logging.error('Failed to publish rabbitmq message')
        finally:
            await rabbitmq_connection.close()
            
    return "OK"


@router.delete('/zapier/webhook')
async def unsubscribe_zapier_webhook(
    hook_data = Body(...),
    domain = Depends(check_api_key),
    integrations_service: IntegrationService = Depends(get_integration_service)
):
    hook_url=hook_data.get('hookUrl')
    sync = integrations_service.get_sync_by_hook_url(hook_url)
    return integrations_service.delete_sync_domain(domain_id=domain.id, list_id=sync[0].id)

@router.get('/zapier/webhook')
async def get_leads_for_zapier(domain = Depends(check_api_key), integrations_service: IntegrationService = Depends(get_integration_service)):
    return integrations_service.get_leads_for_zapier(domain)
    
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
        return service.shopify.handle_uninstalled_app(payload)
    
    
@router.get("/shopify/landing", response_model=ShopifyLandingResponse)
def oauth_shopify_callback(shop: str, r: Request, integrations_service: IntegrationService = Depends(get_integration_service)):
    with integrations_service as service:
        result = service.shopify.oauth_shopify_callback(shop, r)
        return ShopifyLandingResponse(token=result.get('token'), message=result.get('message'))
    
@router.post("/shopify/customers/redact", status_code=status.HTTP_200_OK)
async def shopify_customers_redact(r: Request, integrations_service: IntegrationService = Depends(get_integration_service)):
    
    with integrations_service as service:
        request_body = await r.body()
        shopify_hmac_header = r.headers.get("X-Shopify-Hmac-SHA256")
        service.shopify.shopify_customers_redact(request_body, shopify_hmac_header)
        return GenericEcommerceResponse(message="No customer data found")
        

@router.post("/shopify/shop/redact", status_code=status.HTTP_200_OK)
async def oauth_shopify_redact(r: Request, integrations_service: IntegrationService = Depends(get_integration_service)):    
    with integrations_service as service:
        request_body = await r.body()
        shopify_hmac_header = r.headers.get("X-Shopify-Hmac-SHA256")
        service.shopify.oauth_shopify_redact(request_body, shopify_hmac_header)
        return GenericEcommerceResponse(message="Shopify data deleted successfully")

@router.get("/get-channels")
def get_channels(service_name: str = Query(...),
                           customer_id: str = Query(...),
                           user = Depends(check_user_authentication), 
                           domain = Depends(check_domain), 
                           integration_service: IntegrationService = Depends(get_integration_service)):
    with integration_service as service:
        service = getattr(service, service_name)
        return service.get_user_lists(domain.id, customer_id, user.get('id'))

@router.get("/get-campaigns")
def get_campaigns(service_name: str = Query(...),
                           customer_id: str = Query(...),
                           user = Depends(check_user_authentication), 
                           domain = Depends(check_domain), 
                           integration_service: IntegrationService = Depends(get_integration_service)):
    with integration_service as service:
        service = getattr(service, service_name)
        return service.get_campaigns(domain.id, customer_id, user.get('id'))
      
@router.post("/kajabi")
async def kajabi_webhook(request: Request, domain: str, persistence: IntegrationsPresistence = Depends(get_user_integrations_presistence)):
    body = await request.json()
    event_type = body.get("event")
    # user_email = body.get("member", {}).get("email")
    # offer_title = body.get("offer", {}).get("title")
    # amount_paid = body.get("payment_transaction", {}).get("amount_paid_decimal")
    # if event_type == "payment.succeeded":
    persistence.create_kajabi(body)

    return {"status": "success", "domain": domain, "event": event_type}

