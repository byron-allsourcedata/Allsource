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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@injectable
class InstantlyIntegrationsService:
    BASE_URL = "https://api.instantly.ai/api/v2"

    def __init__(
        self,
        domain_persistence: UserDomainsPersistence,
        integrations_persistence: IntegrationsPersistence,
        leads_persistence: LeadsPersistence,
        sync_persistence: IntegrationsUserSyncPersistence,
        million_verifier_integrations: MillionVerifierIntegrationsService,
    ):
        self.domain_persistence = domain_persistence
        self.integrations_persistence = integrations_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.client = requests.Session()

    def __handle_request(
        self,
        method: str,
        url: str,
        api_key: str,
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

        headers["Authorization"] = f"Bearer {api_key}   "

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
        api_key = credentials.instantly.api_key
        domain_id = domain.id if domain else None
        resp = self.__handle_request(
            method="GET", url=f"{self.BASE_URL}/campaigns", api_key=api_key
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=401, detail="Invalid Instantly API key"
            )

        existing = self._get_credentials(domain_id, user["id"])
        if existing:
            existing.access_token = api_key
            existing.is_failed = False
            self.integrations_persistence.db.commit()
            return existing

        common_integration = os.getenv("COMMON_INTEGRATION") == "True"
        integration_data = {
            "access_token": api_key,
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

    async def create_sync(
        self,
        domain_id: int,
        leads_type: str,
        list_id: str,
        list_name: str,
        data_map: list,
        created_by: str,
        user: dict,
    ):
        credentials = self._get_credentials(
            user_id=user.get("id"), domain_id=domain_id
        )
        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credentials.id,
                "list_id": list_id,
                "list_name": list_name,
                "sent_contacts": -1,
                "domain_id": domain_id,
                "sync_type": DataSyncType.CONTACT.value,
                "leads_type": leads_type,
                "data_map": data_map,
                "created_by": created_by,
            }
        )
        return sync

    def create_list(self, list_data, domain_id: int, user_id: int):
        credentials = self._get_credentials(domain_id, user_id)

        payload = {"name": list_data.name}
        try:
            response = self.__handle_request(
                method="POST",
                url=f"{self.BASE_URL}/lead-lists",
                api_key=credentials.access_token,
                json=payload,
            )
            body = response.json()
            return ListFromIntegration(id=body["id"], list_name=body["name"])
        except requests.HTTPError as e:
            if e.response.status_code == 401:
                credentials.error_message = "Invalid API Key"
                credentials.is_failed = True
                self.integrations_persistence.db.commit()
                return {"status": IntegrationsStatus.CREDENTIALS_INVALID.value}
            return {"status": IntegrationsStatus.CREATE_IS_FAILED.value}

    def get_list(self, user_id: int, domain_id: int):
        credentials = self._get_credentials(domain_id, user_id)

        try:
            response = self.__handle_request(
                method="GET",
                url=f"{self.BASE_URL}/lead-lists",
                # url=f"{self.BASE_URL}/contacts/lists",
                api_key=credentials.access_token,
            )
            data = response.json()
            lists = data["items"]
            if len(lists):
                return [
                    ListFromIntegration(id=l["id"], list_name=l["name"])
                    for l in lists
                ]
        except requests.HTTPError as e:
            credentials.error_message = str(e)
            credentials.is_failed = True
            self.integrations_persistence.db.commit()
            return None

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: list[tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
    ):
        profiles_emails = []
        results = []

        for lead_user, five_x_five_user in user_data:
            profile = await self.__map_lead_to_instantly_contact(
                five_x_five_user,
                integration_data_sync.data_map,
                is_email_validation_enabled,
            )
            if profile in (
                ProccessDataSyncResult.INCORRECT_FORMAT.value,
                ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
                ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
            ):
                results.append({"lead_id": lead_user.id, "status": profile})
                continue

            email = profile.get("email")
            if not email:
                results.append(
                    {
                        "lead_id": lead_user.id,
                        "status": ProccessDataSyncResult.INCORRECT_FORMAT.value,
                    }
                )
                continue

            profiles_emails.append(email)
            results.append(
                {
                    "lead_id": lead_user.id,
                    "status": ProccessDataSyncResult.SUCCESS.value,
                }
            )

        if not profiles_emails:
            return results

        status = self.sync_contacts_bulk(
            integration_data_sync.list_id, profiles_emails, user_integration
        )
        print("status in process_data_sync_lead", status)
        if status != ProccessDataSyncResult.SUCCESS.value:
            for r in results:
                if r["status"] == ProccessDataSyncResult.SUCCESS.value:
                    r["status"] = status
        return results

    def sync_contacts_bulk(
        self, list_id: str, emails: list[str], user_integration: UserIntegration
    ):
        print("user_integration.access_token", user_integration.access_token)
        print("list_id", list_id)
        clean_emails = [str(e) for e in emails if e]
        payload = {
            "contacts": clean_emails,
            "to_list_id": list_id,
            "check_duplicates": True,
        }
        try:
            resp = self.__handle_request(
                method="POST",
                url=f"{self.BASE_URL}/leads/move",
                api_key=user_integration.access_token,
                json=payload,
            )
            try:
                body = resp.json()
            except Exception:
                body = resp.text
            logger.info("Instantly /leads/move response: %s", body)
            if resp.status_code not in (200, 201, 202):
                logger.error(
                    "Instantly API error: %s - %s",
                    resp.status_code,
                    resp.text,
                )
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
            return ProccessDataSyncResult.SUCCESS.value
        except requests.HTTPError as e:
            logging.error(e)
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value

    async def __map_lead_to_instantly_contact(
        self,
        five_x_five_user: FiveXFiveUser,
        data_map: list,
        is_email_validation_enabled: bool,
    ) -> dict | str:
        if is_email_validation_enabled:
            email = await get_valid_email(
                five_x_five_user, self.million_verifier_integrations
            )
        else:
            email = get_valid_email_without_million(five_x_five_user)

        if email in (
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
        ):
            return email

        phone = get_valid_phone(five_x_five_user)
        return {
            "email": email,
            "first_name": getattr(five_x_five_user, "first_name", None),
            "last_name": getattr(five_x_five_user, "last_name", None),
            "phone": format_phone_number(phone),
            "company": getattr(five_x_five_user, "company_name", None),
            "job_title": getattr(five_x_five_user, "job_title", None),
            "custom_fields": {
                field["value"]: getattr(five_x_five_user, field["type"], None)
                for field in data_map
            },
        }

    def edit_sync(
        self,
        leads_type: str,
        list_id: str,
        list_name: str,
        integrations_users_sync_id: int,
        data_map: list,
        domain_id: int,
        created_by: str,
        user_id: int,
    ):
        credentials = self._get_credentials(domain_id, user_id)
        return self.sync_persistence.edit_sync(
            {
                "integration_id": credentials.id,
                "list_id": list_id,
                "list_name": list_name,
                "leads_type": leads_type,
                "data_map": data_map,
                "created_by": created_by,
            },
            integrations_users_sync_id,
        )
