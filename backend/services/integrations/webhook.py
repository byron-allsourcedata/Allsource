import logging
import os
from datetime import datetime, timedelta
from typing import List, Tuple, Annotated

import httpx
from fastapi import HTTPException, Depends
from httpx import Client

from enums import (
    IntegrationsStatus,
    SourcePlatformEnum,
    ProccessDataSyncResult,
    DataSyncType,
)
from models import UserIntegration, LeadUser
from models.five_x_five_users import FiveXFiveUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import (
    IntegrationsPresistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
from resolver import injectable
from schemas.integrations.integrations import DataMap, IntegrationCredentials
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from utils import extract_first_email, get_http_client
from utils import format_phone_number

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@injectable
class WebhookIntegrationService:
    def __init__(
        self,
        lead_persistence: LeadsPersistence,
        domain_persistence: UserDomainsPersistence,
        sync_persistence: IntegrationsUserSyncPersistence,
        integration_persistence: IntegrationsPresistence,
        client: Annotated[httpx.Client, Depends(get_http_client)],
        million_verifier_integrations: MillionVerifierIntegrationsService,
    ):
        self.leads_persistence = lead_persistence
        self.domain_persistence = domain_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.integration_persistence = integration_persistence
        self.client = client

    def __handle_request(
        self,
        url: str,
        headers: dict = None,
        json: dict = None,
        data: dict = None,
        params: dict = None,
        api_key: str = None,
        method: str = "GET",
    ):
        try:
            if not headers:
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "accept": "application/json",
                    "content-type": "application/json",
                }
            response = self.client.request(
                method,
                url,
                headers=headers,
                json=json,
                data=data,
                params=params,
            )
            if response.is_redirect:
                redirect_url = response.headers.get("Location")
                if redirect_url:
                    response = self.client.request(
                        method,
                        redirect_url,
                        headers=headers,
                        json=json,
                        data=data,
                        params=params,
                    )
            return response
        except httpx.ConnectError as e:
            logger.error(f"Connection error: {e}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error: {e}")
            return None

    def save_integration(self, domain_id: int, user: dict):
        credential = self.integration_persistence.get_credentials_for_service(
            domain_id=domain_id,
            service_name=SourcePlatformEnum.WEBHOOK.value,
            user_id=user.get("id"),
        )
        if credential:
            credential.is_failed = False
            credential.error_message = None
            self.integration_persistence.db.commit()
            return credential

        common_integration = os.getenv("COMMON_INTEGRATION") == "True"
        integration_data = {
            "full_name": user.get("full_name"),
            "service_name": SourcePlatformEnum.WEBHOOK.value,
        }

        if common_integration:
            integration_data["user_id"] = user.get("id")
        else:
            integration_data["domain_id"] = domain_id

        integartion = self.integration_persistence.create_integration(
            integration_data
        )

        if not integartion:
            raise HTTPException(
                status_code=409,
                detail={"status": IntegrationsStatus.CREATE_IS_FAILED.value},
            )

        return IntegrationsStatus.SUCCESS

    def add_integration(
        self, credentials: IntegrationCredentials, domain, user: dict
    ):
        domain_id = domain.id if domain else None
        integration = self.save_integration(domain_id=domain_id, user=user)
        return integration

    def create_list(self, list, domain_id: int, user_id: int):
        credential = self.integration_persistence.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.WEBHOOK.value,
        )
        if not credential:
            raise HTTPException(
                status_code=403,
                detail={"status": IntegrationsStatus.CREDENTIALS_NOT_FOUND},
            )
        response = self.__handle_request(
            url=list.webhook_url, method=list.method
        )
        if not response or response.status_code == 404:
            self.integration_persistence.db.commit()
            return IntegrationsStatus.INVALID_WEBHOOK_URL

        return IntegrationsStatus.SUCCESS

    async def create_sync(
        self,
        leads_type: str,
        list_name: str,
        webhook_url: str,
        method: str,
        data_map: List[DataMap],
        domain_id: int,
        created_by: str,
        user: dict,
    ):
        credential = self.integration_persistence.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user.get("id"),
            service_name=SourcePlatformEnum.WEBHOOK.value,
        )
        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credential.id,
                "list_name": list_name,
                "domain_id": domain_id,
                "leads_type": leads_type,
                "data_map": data_map,
                "sent_contacts": -1,
                "sync_type": DataSyncType.CONTACT.value,
                "created_by": created_by,
                "hook_url": webhook_url,
                "method": method,
            }
        )
        return sync

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: List[Tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
    ):
        results = []
        for lead_user, five_x_five_user in user_data:
            data = await self.__mapped_lead(
                five_x_five_user=five_x_five_user,
                data_map=integration_data_sync.data_map,
                is_email_validation_enabled=is_email_validation_enabled,
            )
            if data in (
                ProccessDataSyncResult.INCORRECT_FORMAT.value,
                ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
            ):
                results.append({"lead_id": lead_user.id, "status": data})
                continue
            else:
                results.append(
                    {
                        "lead_id": lead_user.id,
                        "status": ProccessDataSyncResult.SUCCESS.value,
                    }
                )

            profile = self.__send_profile(
                data=data,
                integration_data_sync=integration_data_sync,
            )
            if profile in (
                ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
                ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ):
                for result in results:
                    if result["status"] == ProccessDataSyncResult.SUCCESS.value:
                        result["status"] = result

        return results

    def __send_profile(
        self,
        integration_data_sync: IntegrationUserSync,
        data: dict,
    ):
        logger.info(f"sending data: {data}")
        response = self.__handle_request(
            url=integration_data_sync.hook_url,
            method=integration_data_sync.method,
            json=data,
        )
        if not response or response.status_code == 401:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        if response.status_code == 405:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        if response.status_code == 400:
            return ProccessDataSyncResult.PLATFORM_VALIDATION_FAILED.value

        return ProccessDataSyncResult.SUCCESS.value

    async def get_valid_email(
        self, five_x_five_user, email_fields, is_email_validation_enabled: bool
    ) -> str:
        thirty_days_ago = datetime.now() - timedelta(days=30)
        thirty_days_ago_str = thirty_days_ago.strftime("%Y-%m-%d %H:%M:%S")
        verity = 0
        for field in email_fields:
            email = getattr(five_x_five_user, field, None)
            if email:
                emails = extract_first_email(email)
                for email in emails:
                    if (
                        email
                        and field == "business_email"
                        and five_x_five_user.business_email_last_seen
                    ):
                        if (
                            five_x_five_user.business_email_last_seen.strftime(
                                "%Y-%m-%d %H:%M:%S"
                            )
                            > thirty_days_ago_str
                        ):
                            return email.strip()
                    if (
                        email
                        and field == "personal_emails"
                        and five_x_five_user.personal_emails_last_seen
                    ):
                        personal_emails_last_seen_str = (
                            five_x_five_user.personal_emails_last_seen.strftime(
                                "%Y-%m-%d %H:%M:%S"
                            )
                        )
                        if personal_emails_last_seen_str > thirty_days_ago_str:
                            return email.strip()
                    if (
                        email
                        and is_email_validation_enabled
                        and await self.million_verifier_integrations.is_email_verify(
                            email=email
                        )
                    ):
                        return email.strip()
                    verity += 1
        if verity > 0:
            return ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value
        return ProccessDataSyncResult.INCORRECT_FORMAT.value

    def build_full_url(self, page, page_parameters):
        if page_parameters:
            return f"{page}?{page_parameters}".rstrip("&")
        return page

    @staticmethod
    def map_phone_numbers(five_x_five_user, mapped_fields):
        properties = {}

        if (
            "business_phone" in mapped_fields
            and "personal_phone" in mapped_fields
        ):
            direct, personal, mobile = (
                five_x_five_user.direct_number,
                five_x_five_user.personal_phone,
                five_x_five_user.mobile_phone,
            )

            match (bool(direct), bool(personal), bool(mobile)):
                case (True, True, True):
                    properties["business_phone"] = format_phone_number(direct)
                    properties["personal_phone"] = (
                        f"{format_phone_number(personal)}, {format_phone_number(mobile)}"
                    )
                case (True, False, False):
                    properties["business_phone"] = format_phone_number(direct)
                    properties["personal_phone"] = None
                case (False, False, False):
                    properties["business_phone"] = None
                    properties["personal_phone"] = None
                case (True, True, False):
                    properties["business_phone"] = format_phone_number(direct)
                    properties["personal_phone"] = format_phone_number(personal)
                case (True, False, True):
                    properties["business_phone"] = format_phone_number(direct)
                    properties["personal_phone"] = format_phone_number(mobile)
                case (False, True, True):
                    properties["business_phone"] = format_phone_number(mobile)
                    properties["personal_phone"] = format_phone_number(personal)
                case (False, False, True):
                    properties["business_phone"] = format_phone_number(mobile)
                    properties["personal_phone"] = format_phone_number(mobile)
                case (False, True, False):
                    properties["business_phone"] = None
                    properties["personal_phone"] = format_phone_number(personal)

        if (
            "business_phone" in mapped_fields
            and "business_phone" not in properties
        ):
            direct, personal, mobile = (
                five_x_five_user.direct_number,
                five_x_five_user.personal_phone,
                five_x_five_user.mobile_phone,
            )

            match (bool(direct), bool(personal), bool(mobile)):
                case (
                    (True, True, True)
                    | (True, True, False)
                    | (True, False, True)
                    | (True, False, False)
                ):
                    properties["business_phone"] = format_phone_number(direct)
                case (False, True, True) | (False, False, True):
                    properties["business_phone"] = format_phone_number(mobile)
                case (False, True, False) | (False, False, False):
                    properties["business_phone"] = None

        if (
            "personal_phone" in mapped_fields
            and "personal_phone" not in properties
        ):
            personal, mobile = (
                five_x_five_user.personal_phone,
                five_x_five_user.mobile_phone,
            )

            match (bool(personal), bool(mobile)):
                case (True, True):
                    properties["personal_phone"] = (
                        f"{format_phone_number(personal)}, {format_phone_number(mobile)}"
                    )
                case (True, False):
                    properties["personal_phone"] = format_phone_number(personal)
                case (False, True):
                    properties["personal_phone"] = format_phone_number(mobile)
                case (False, False):
                    properties["personal_phone"] = None
        return properties

    async def __mapped_lead(
        self,
        five_x_five_user: FiveXFiveUser,
        data_map,
        is_email_validation_enabled: bool,
    ):
        properties = {}
        validation_email = 2
        if all(
            item.get("type") == "" and item.get("value") == ""
            for item in data_map
        ):
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        mapped_fields = {mapping["type"] for mapping in data_map}
        for mapping in data_map:
            five_x_five_field = mapping["type"]
            if five_x_five_field == "company_industry":
                five_x_five_field = "primary_industry"
            value_field = getattr(five_x_five_user, five_x_five_field, "")
            if value_field:
                if isinstance(value_field, datetime):
                    properties[mapping["value"]] = value_field.strftime(
                        "%Y-%m-%d"
                    )
                elif isinstance(value_field, str):
                    properties[mapping["value"]] = (
                        value_field[:2048]
                        if len(value_field) > 2048
                        else value_field
                    )
                else:
                    properties[mapping["value"]] = value_field
            else:
                properties[mapping["value"]] = ""

        if "time_on_site" in mapped_fields or "url_visited" in mapped_fields:
            time_on_site, url_visited = self.leads_persistence.get_visit_stats(
                five_x_five_user.id
            )
            for mapping in data_map:
                if mapping["type"] == "time_on_site":
                    properties[mapping["value"]] = time_on_site
                if mapping["type"] == "url_visited":
                    properties[mapping["value"]] = url_visited

        if "business_email" in mapped_fields:
            result = await self.get_valid_email(
                five_x_five_user,
                ["business_email"],
                is_email_validation_enabled,
            )
            for mapping in data_map:
                if mapping["type"] == "business_email":
                    if result in (
                        ProccessDataSyncResult.INCORRECT_FORMAT.value,
                        ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
                    ):
                        validation_email -= 1
                        properties[mapping["value"]] = None
                    else:
                        properties[mapping["value"]] = result

        if "mobile_phone" in mapped_fields:
            properties["mobile_phone"] = format_phone_number(
                five_x_five_user.mobile_phone
            )

        properties.update(
            self.map_phone_numbers(five_x_five_user, mapped_fields)
        )

        if "personal_email" in mapped_fields:
            email_fields = ["personal_emails", "additional_personal_emails"]
            result = await self.get_valid_email(
                five_x_five_user, email_fields, is_email_validation_enabled
            )
            for mapping in data_map:
                if mapping["type"] == "personal_email":
                    if result in (
                        ProccessDataSyncResult.INCORRECT_FORMAT.value,
                        ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
                    ):
                        validation_email -= 1
                        properties[mapping["value"]] = None
                    else:
                        properties[mapping["value"]] = result

        if validation_email == 0:
            return ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value

        return properties

    def edit_sync(
        self,
        list_name: str,
        webhook_url: str,
        method: str,
        data_map: List[DataMap],
        integrations_users_sync_id,
        leads_type: str,
        domain_id: int,
        created_by: str,
        user_id: int,
    ):
        sync = self.sync_persistence.edit_sync(
            {
                "list_name": list_name,
                "leads_type": leads_type,
                "hook_url": webhook_url,
                "method": method,
                "created_by": created_by,
                "data_map": data_map,
            },
            integrations_users_sync_id,
        )

        return sync
