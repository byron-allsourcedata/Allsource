import logging
import os
from datetime import datetime
from typing import List, Any, Tuple, Annotated
from uuid import UUID

import httpcore
import httpx
from fastapi import HTTPException, Depends

from enums import (
    SourcePlatformEnum,
    IntegrationsStatus,
    ProccessDataSyncResult,
    DataSyncType,
    IntegrationLimit,
)
from models import FiveXFiveUser, LeadUser
from models.enrichment.enrichment_users import EnrichmentUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import (
    IntegrationsPersistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
from resolver import injectable
from schemas.integrations.integrations import DataMap
from schemas.integrations.integrations import IntegrationCredentials
from services.integrations.commonIntegration import *
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from utils import (
    get_valid_email,
    get_valid_location,
    get_valid_phone,
    get_http_client,
    get_valid_email_without_million,
    validate_and_format_phone,
    to_snake_case,
)


@injectable
class HubspotIntegrationsService:
    def __init__(
        self,
        domain_persistence: UserDomainsPersistence,
        integrations_persistence: IntegrationsPersistence,
        leads_persistence: LeadsPersistence,
        sync_persistence: IntegrationsUserSyncPersistence,
        client: Annotated[httpx.Client, Depends(get_http_client)],
        million_verifier_integrations: MillionVerifierIntegrationsService,
    ):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.client = client

    async def __async_handle_request(
        self, method: str, url: str, access_token: str, json: dict = None
    ):
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=json,
                )
            return response

        except httpx.ConnectTimeout:
            logging.error(f"Timeout when connecting to {url}")
            return {"error": "Timeout"}

        except httpcore.ConnectError as e:
            logging.error(f"Connection error to {url}: {e}")
            return {"error": "Connection error"}

        except httpx.ReadError as e:
            logging.error(f"Read error from {url}: {e}")
            return {"error": "Read error"}

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logging.warning(e.response.headers)
                retry_after = int(e.response.headers.get("Retry-After", 1))
                logging.warning(
                    f"Rate limit exceeded. Retrying after {retry_after} seconds."
                )
            else:
                logging.error(f"HTTP error occurred: {e}")
            return {"error": "HTTP status error"}

        except httpx.RequestError as e:
            logging.error(
                f"Request failed: {type(e).__name__} - {e!s} (URL: {url})"
            )
            return {"error": "Request failed"}

        return response

    def __handle_request(
        self,
        method: str,
        url: str,
        headers: dict = None,
        json: dict = None,
        data: dict = None,
        params: dict = None,
        access_token: str = None,
    ):
        if not headers:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        response = self.client.request(
            method, url, headers=headers, json=json, data=data, params=params
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

    async def create_custom_property(
        self,
        access_token: str,
        name: str,
        label: str,
        object_type: str = "contacts",
        group_name: str = "contactinformation",
        field_type: str = "text",
        type_: str = "string",
    ):
        name_snake = to_snake_case(name)
        url = f"https://api.hubapi.com/crm/v3/properties/{object_type}"
        payload = {
            "name": name_snake,
            "label": label,
            "groupName": group_name,
            "type": type_,  # internal type: string, number, datetime
            "fieldType": field_type,  # visual input: text, number, date
        }

        resp = await self.__async_handle_request(
            method="POST",
            url=url,
            access_token=access_token,
            json=payload,
        )
        if resp.status_code not in (200, 201):
            logging.warning(
                "Failed to create property '%s': %s",
                name,
                resp.text,
            )
        return resp

    async def ensure_custom_properties_exist(
        self,
        access_token: str,
        data_map: list[dict],
        object_type: str = "contacts",
    ):
        """
        Создаёт недостающие custom-поля в HubSpot для полей из data_map с is_constant=True.
        """
        url = f"https://api.hubapi.com/crm/v3/properties/{object_type}"
        resp = await self.__async_handle_request(
            method="GET", url=url, access_token=access_token
        )

        if resp.status_code != 200:
            logging.warning(
                "Failed to fetch existing properties: %s", resp.text
            )
            return

        existing_properties = {
            prop["name"] for prop in resp.json().get("results", [])
        }

        for field in data_map:
            if not field.get("is_constant"):
                continue

            name = field["type"]
            if name in existing_properties:
                continue

            await self.create_custom_property(
                access_token=access_token,
                name=name,
                label=name.replace("_", " ").title(),
                object_type=object_type,
            )

    def get_credentials(self, domain_id: int, user_id: int):
        credential = self.integrations_persisntece.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.HUBSPOT.value,
        )
        return credential

    def get_smart_credentials(self, user_id: int):
        credential = (
            self.integrations_persisntece.get_smart_credentials_for_service(
                user_id=user_id, service_name=SourcePlatformEnum.HUBSPOT.value
            )
        )
        return credential

    def __save_integrations(self, api_key: str, domain_id: int, user: dict):
        credential = self.get_credentials(domain_id, user.get("id"))
        if credential:
            credential.access_token = api_key
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persisntece.db.commit()
            return credential

        common_integration = os.getenv("COMMON_INTEGRATION") == "True"
        integration_data = {
            "access_token": api_key,
            "full_name": user.get("full_name"),
            "service_name": SourcePlatformEnum.HUBSPOT.value,
            "limit": IntegrationLimit.HUBSPOT.value,
        }

        if common_integration:
            integration_data["user_id"] = user.get("id")
        else:
            integration_data["domain_id"] = domain_id

        integration = self.integrations_persisntece.create_integration(
            integration_data
        )

        if not integration:
            raise HTTPException(
                status_code=409,
                detail={"status": IntegrationsStatus.CREATE_IS_FAILED.value},
            )

        return integration

    def test_API_key(self, access_token: str):
        json_data = {
            "properties": {
                "email": "testTest",
                "firstname": "Test Test",
                "lastname": "Test Test",
                "phone": "123-456-7890",
                "company": "Test",
            }
        }
        response = self.__handle_request(
            method="POST",
            url="https://api.hubapi.com/crm/v3/objects/contacts",
            access_token=access_token,
            json=json_data,
        )

        if response.status_code == 400:
            return True
        return False

    def add_integration(
        self, credentials: IntegrationCredentials, domain, user: dict
    ):
        domain_id = domain.id if domain else None
        try:
            if self.test_API_key(credentials.hubspot.access_token) == False:
                return {"status": IntegrationsStatus.CREDENTIALS_INVALID.value}
        except:
            return {"status": IntegrationsStatus.CREDENTIALS_INVALID.value}
        integartions = self.__save_integrations(
            credentials.hubspot.access_token,
            domain_id,
            user,
        )
        return {
            "integartions": integartions,
            "status": IntegrationsStatus.SUCCESS.value,
        }

    async def create_sync(
        self,
        domain_id: int,
        created_by: str,
        user: dict,
        data_map: List[DataMap] = None,
        leads_type: str = None,
    ):
        credentials = self.get_credentials(
            user_id=user.get("id"), domain_id=domain_id
        )
        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credentials.id,
                "sent_contacts": -1,
                "sync_type": DataSyncType.CONTACT.value,
                "leads_type": leads_type,
                "data_map": data_map,
                "domain_id": domain_id,
                "created_by": created_by,
            }
        )
        return sync

    def create_smart_audience_sync(
        self,
        smart_audience_id: UUID,
        sent_contacts: int,
        data_map: List[DataMap],
        created_by: str,
        user: dict,
    ):
        credentials = self.get_smart_credentials(user_id=user.get("id"))
        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credentials.id,
                "sent_contacts": sent_contacts,
                "sync_type": DataSyncType.AUDIENCE.value,
                "smart_audience_id": smart_audience_id,
                "data_map": data_map,
                "created_by": created_by,
            }
        )
        return sync

    def edit_sync(
        self,
        leads_type: str,
        integrations_users_sync_id: int,
        domain_id: int,
        created_by: str,
        user_id: int,
        data_map: List[DataMap] = None,
    ):
        credentials = self.get_credentials(domain_id, user_id)
        sync = self.sync_persistence.edit_sync(
            {
                "integration_id": credentials.id,
                "leads_type": leads_type,
                "data_map": data_map,
                "created_by": created_by,
            },
            integrations_users_sync_id,
        )

        return sync

    async def process_data_sync(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        enrichment_users: List[EnrichmentUser],
        target_schema: str = None,
        validations: dict = {},
    ):
        profiles = []
        results = []
        for enrichment_user in enrichment_users:
            profile = await self.__mapped_profile(
                enrichment_user,
                target_schema,
                validations,
                integration_data_sync.data_map,
            )
            if profile == ProccessDataSyncResult.INCORRECT_FORMAT.value:
                results.append(
                    {
                        "enrichment_user_asid": enrichment_user.asid,
                        "status": profile,
                    }
                )
                continue
            else:
                results.append(
                    {
                        "enrichment_user_asid": enrichment_user.asid,
                        "status": ProccessDataSyncResult.SUCCESS.value,
                    }
                )

            profiles.append(profile)

        if not profiles:
            return results

        list_response = await self.__create_profiles(
            user_integration.access_token, profiles
        )

        if list_response != ProccessDataSyncResult.SUCCESS.value:
            for result in results:
                if result["status"] == ProccessDataSyncResult.SUCCESS.value:
                    result["status"] = list_response

        return results

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: List[Tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
    ):
        await self.ensure_custom_properties_exist(
            access_token=user_integration.access_token,
            data_map=integration_data_sync.data_map,
        )
        profiles = []
        results = []
        for lead_user, five_x_five_user in user_data:
            profile = await self.__mapped_profile_lead(
                five_x_five_user,
                integration_data_sync.data_map,
                is_email_validation_enabled,
            )
            if profile in (
                ProccessDataSyncResult.INCORRECT_FORMAT.value,
                ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
            ):
                results.append({"lead_id": lead_user.id, "status": profile})
                continue
            else:
                results.append(
                    {
                        "lead_id": lead_user.id,
                        "status": ProccessDataSyncResult.SUCCESS.value,
                    }
                )

            profiles.append(profile)

        if not profiles:
            return results

        result_bulk = await self.__create_profiles(
            user_integration.access_token, profiles
        )
        if result_bulk != ProccessDataSyncResult.SUCCESS.value:
            for result in results:
                if result["status"] == ProccessDataSyncResult.SUCCESS.value:
                    result["status"] = result_bulk

        return results

    async def fetch_all_contacts(self, access_token, emails, after=None):
        search_payload = {
            "filterGroups": [
                {
                    "filters": [
                        {
                            "propertyName": "email",
                            "operator": "IN",
                            "values": emails,
                        }
                    ]
                }
            ],
            "properties": ["email"],
        }
        if after:
            search_payload["after"] = after

        search_resp = await self.__async_handle_request(
            url="https://api.hubapi.com/crm/v3/objects/contacts/search",
            method="POST",
            access_token=access_token,
            json=search_payload,
        )

        if search_resp.status_code != 200:
            logging.error("Search failed: %s", search_resp.text)
            return []

        results = search_resp.json().get("results", [])
        paging = search_resp.json().get("paging", {})
        after = paging.get("next", {}).get("after")
        if after:
            results.extend(
                await self.fetch_all_contacts(access_token, emails, after)
            )

        return results

    def handle_hubspot_response(self, response, action="create"):
        if response.status_code in (200, 201):
            logging.debug(f"Batch {action} success: %s", response.text)
            return ProccessDataSyncResult.SUCCESS.value

        elif response.status_code == 207:
            logging.error(f"Partial {action}; details: %s", response.json())
            return ProccessDataSyncResult.SUCCESS.value

        elif response.status_code in (400, 422):
            logging.error("Incorrect format: %s", response.text)
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        elif response.status_code == 401:
            logging.debug("Authentication failed: %s", response.text)
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value

        elif response.status_code == 403:
            logging.debug("Forbidden: insufficient permissions to %s", action)
            return ProccessDataSyncResult.FORBIDDEN.value

        elif response.status_code == 402:
            category = response.json().get("category")
            logging.warning("402: %s", category)
            if category == "PAYMENT_REQUIRED":
                return ProccessDataSyncResult.PAYMENT_REQUIRED.value

        else:
            logging.warning(
                "Unexpected error during %s; details: %s",
                action,
                response.json(),
            )
            return ProccessDataSyncResult.UNEXPECTED_ERROR.value

    async def __create_profiles(self, access_token, profiles_list):
        emails = [p.get("email") for p in profiles_list if p.get("email")]
        all_contacts = await self.fetch_all_contacts(access_token, emails)
        existing = {
            item["properties"]["email"]: item["id"] for item in all_contacts
        }
        to_update = []
        to_create = []
        created_emails = set()
        for props in profiles_list:
            email = props.get("email")
            clean_props = {k: v for k, v in props.items() if v is not None}
            if email in existing:
                clean_props.pop("email", None)
                to_update.append(
                    {"id": existing[email], "properties": clean_props}
                )
            else:
                if email not in created_emails:
                    created_emails.add(email)
                    to_create.append({"properties": clean_props})

        if to_create:
            create_resp = self.__handle_request(
                url="https://api.hubapi.com/crm/v3/objects/contacts/batch/create",
                method="POST",
                access_token=access_token,
                json={"inputs": to_create},
            )

            result = self.handle_hubspot_response(create_resp, action="create")
            if result != ProccessDataSyncResult.SUCCESS.value:
                return result

        if to_update:
            update_resp = self.__handle_request(
                url="https://api.hubapi.com/crm/v3/objects/contacts/batch/update",
                method="POST",
                access_token=access_token,
                json={"inputs": to_update},
            )

            result = self.handle_hubspot_response(update_resp, action="update")
            if result != ProccessDataSyncResult.SUCCESS.value:
                return result

        return ProccessDataSyncResult.SUCCESS.value

    async def __mapped_profile(
        self,
        enrichment_user: EnrichmentUser,
        target_schema: str,
        validations: dict,
        data_map: list,
    ) -> dict[str, Any] | None:
        enrichment_contacts = enrichment_user.contacts
        if not enrichment_contacts:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        business_email, personal_email, phone = (
            self.sync_persistence.get_verified_email_and_phone(
                enrichment_user.asid
            )
        )
        main_email, main_phone = resolve_main_email_and_phone(
            enrichment_contacts=enrichment_contacts,
            validations=validations,
            target_schema=target_schema,
            business_email=business_email,
            personal_email=personal_email,
            phone=phone,
        )
        first_name = enrichment_contacts.first_name
        last_name = enrichment_contacts.last_name

        if not main_email or not first_name or not last_name:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        result = {
            "email": main_email,
            "firstname": first_name,
            "lastname": last_name,
        }

        required_types = {m["type"] for m in data_map}
        context = {
            "main_phone": main_phone if main_phone else None,
            "professional_profiles": enrichment_user.professional_profiles,
            "postal": enrichment_user.postal,
            "personal_profiles": enrichment_user.personal_profiles,
        }

        for field_type in required_types:
            filler = FIELD_FILLERS.get(field_type)
            if filler:
                filler(result, context)

        return result

    async def __mapped_profile_lead(
        self,
        lead: FiveXFiveUser,
        data_map: list,
        is_email_validation_enabled: bool,
    ) -> str | dict[str | Any, str | None | Any]:
        if is_email_validation_enabled:
            first_email = await get_valid_email(
                lead, self.million_verifier_integrations
            )
        else:
            first_email = get_valid_email_without_million(lead)

        if first_email in (
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
        ):
            return first_email

        first_phone = get_valid_phone(lead)
        location = get_valid_location(lead)

        profile = {
            "email": first_email,
            "phone": validate_and_format_phone(first_phone),
            "address": location[0],
            "firstname": getattr(lead, "first_name", None),
            "lastname": getattr(lead, "last_name", None),
            "company": getattr(lead, "company_name", None),
            "website": getattr(lead, "company_domain", None),
            "jobtitle": getattr(lead, "job_title", None),
            "industry": getattr(lead, "primary_industry", None),
            "annualrevenue": getattr(lead, "company_revenue", None),
            "hs_linkedin_url": getattr(lead, "linkedin_url", None),
            "gender": getattr(lead, "gender", None),
        }

        for field in data_map:
            t = field["type"]
            v = field["value"]
            is_constant = field.get("is_constant")

            if is_constant is True:
                profile[t] = v
                continue

            val = getattr(lead, t, None)
            if val is None:
                continue

            if isinstance(val, datetime):
                val = val.strftime("%Y-%m-%dT%H:%M:%SZ")

            profile[v] = val

        cleaned = {}
        for k, v in profile.items():
            if v in (None, ""):
                continue
            key = k.lower()[:100]
            key = re.sub(r"[^a-z0-9_]", "_", key)
            cleaned[key] = v
        return cleaned
