import json
import os
import hashlib
import logging
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, Query, HTTPException, status, Body, Request
from fastapi.responses import RedirectResponse
from enums import CreateDataSync
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from persistence.settings_persistence import SettingsPersistence
from dependencies import get_integration_service, IntegrationService, IntegrationsPresistence, \
            get_user_integrations_presistence, check_user_authorization, check_domain, check_user_authorization_without_pixel, \
            check_pixel_install_domain, check_user_authentication, get_user_persistence_service, \
            UserPersistence, get_user_domain_persistence, UserDomainsPersistence, check_api_key, get_settings_persistence
from schemas.integrations.integrations import *
from persistence.domains import UserDomains
from enums import TeamAccessLevel
from schemas.integrations.shopify import ShopifyLandingResponse, GenericEcommerceResponse
import httpx
from typing_extensions import Annotated
from config.bigcommerce import BigcommerceConfig


router = APIRouter()


@router.get('/credentials/{platform}')
async def get_credential_service(platform: str,
                                 integration_service: IntegrationService = Depends(get_integration_service),
                                 user=Depends(check_user_authorization), domain: UserDomains = Depends(check_domain)):
    with integration_service as service:
        service = getattr(service, platform.lower())
        return service.get_credentials(domain.id)


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
        integration_service.delete_integration(service_name, domain)
        return {'message': 'Successfuly'}
    except:
        raise HTTPException(status_code=400)


@router.get('/sync/list/')
async def get_list(ad_account_id: str = Query(None),
                   service_name: str = Query(...),
                   integration_service: IntegrationService = Depends(get_integration_service),
                   user=Depends(check_user_authorization), domain=Depends(check_domain)):
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
                      user=Depends(check_user_authorization), domain=Depends(check_domain)):
    with integrations_service as service:
        service = getattr(service, service_name)
        return service.create_list(list_data, domain.id)
    