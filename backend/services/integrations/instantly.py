import hashlib
import json
import logging
import os
import requests
from datetime import datetime
from typing import Tuple

import mailchimp_marketing as MailchimpMarketing
from fastapi import HTTPException
from mailchimp_marketing.api_client import ApiClientError

from enums import (
    IntegrationsStatus,
    SourcePlatformEnum,
    ProccessDataSyncResult,
    DataSyncType,
    IntegrationLimit,
)
from models import LeadUser
from models.enrichment.enrichment_users import EnrichmentUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import (
    IntegrationsPersistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from resolver import injectable
from schemas.integrations.integrations import *
from services.integrations.commonIntegration import *
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from utils import (
    format_phone_number,
    get_valid_email,
    get_valid_email_without_million,
    get_valid_phone,
)


@injectable
class InstantlyIntegrationsService:
    BASE_URL = "https://api.instantly.ai/api/v2"

    def __init__(
        self,
        domain_persistence: UserDomainsPersistence,
        integrations_persistence: IntegrationsPersistence,
        leads_persistence: LeadsPersistence,
        sync_persistence: IntegrationsUserSyncPersistence,
    ):
        self.domain_persistence = domain_persistence
        self.integrations_persistence = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.client = requests.Session()

    def __handle_request(
        self,
        method: str,
        url: str,
        headers: dict = None,
        json: dict = None,
        data: dict = None,
        params: dict = None,
    ):
        if not headers:
            headers = {
                "accept": "application/json",
                "content-type": "application/json",
            }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        response = self.client.request(
            method=method,
            url=url,
            headers=headers,
            json=json,
            data=data,
            params=params,
        )
        response.raise_for_status()
        return response

    def _get_credentials(self, domain_id: int, user_id: int):
        return self.integrations_persistence.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.INSTANTLY.value,
        )

    def add_integration(
        self, credentials: IntegrationCredentials, domain, user: dict
    ):
        self.api_key = credentials.instantly.api_key
        domain_id = domain.id if domain else None
        resp = self.__handle_request(
            "GET",
            f"{self.BASE_URL}/campaigns",
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=401, detail="Invalid Instantly API key"
            )

        existing = self._get_credentials(domain_id, user["id"])
        if existing:
            existing.access_token = self.api_key
            existing.is_failed = False
            self.integrations_persistence.db.commit()
            return existing

        common_integration = os.getenv("COMMON_INTEGRATION") == "True"
        integration_data = {
            "access_token": self.api_key,
            "service_name": SourcePlatformEnum.INSTANTLY.value,
            "limit": IntegrationLimit.INSTANTLY.value,
            "full_name": user.get("full_name"),
        }

        if common_integration:
            integration_data["user_id"] = user.get("id")
        else:
            integration_data["domain_id"] = domain_id

        return self.integrations_persistence.create_integration(
            integration_data
        )

    def create_lead(self, domain_id: int, user_id: int, lead_data: dict):
        """
        Добавляем контакт в кампанию Instantly.
        """
        creds = self._get_credentials(domain_id, user_id)
        self.api_key = creds.access_token
        resp = self.__handle_request(
            "POST",
            f"{self.BASE_URL}/leads",
            json=lead_data,
        )
        return resp.json()

    def list_campaigns(self, domain_id: int, user_id: int):
        creds = self._get_credentials(domain_id, user_id)
        self.api_key = creds.access_token
        resp = self.__handle_request(
            "GET",
            f"{self.BASE_URL}/campaigns",
        )
        return resp.json().get("campaigns", [])
