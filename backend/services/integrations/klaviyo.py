import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Tuple, Annotated, Dict, Any

import httpcore
import httpx
from fastapi import HTTPException, Depends

from enums import (
    IntegrationsStatus,
    SourcePlatformEnum,
    ProccessDataSyncResult,
    IntegrationLimit,
    DataSyncType,
)
from models import UserIntegration, IntegrationUserSync, LeadUser
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import (
    IntegrationsPresistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from resolver import injectable
from schemas.integrations.integrations import *
from schemas.integrations.klaviyo import *
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from utils import (
    get_valid_email,
    get_http_client,
    get_valid_email_without_million,
)
from utils import validate_and_format_phone, format_phone_number


logger = logging.getLogger(__name__)
logging.getLogger("httpx").setLevel(logging.WARNING)


@injectable
class KlaviyoIntegrationsService:
    def __init__(
        self,
        domain_persistence: UserDomainsPersistence,
        integrations_persistence: IntegrationsPresistence,
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

    def __handle_request(
        self,
        method: str,
        url: str,
        headers: dict = None,
        json: dict = None,
        data: dict = None,
        params: dict = None,
        api_key: str = None,
    ):
        if not headers:
            headers = {
                "Authorization": f"Klaviyo-API-Key {api_key}",
                "revision": "2024-10-15",
                "accept": "application/json",
                "content-type": "application/json",
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

    async def __async_handle_request(
        self, method: str, url: str, api_key: str, json: dict = None
    ):
        headers = {
            "Authorization": f"Klaviyo-API-Key {api_key}",
            "revision": "2024-10-15",
            "Content-Type": "application/json",
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

    def get_credentials(self, domain_id: int, user_id: int):
        credential = self.integrations_persisntece.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.KLAVIYO.value,
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
            "service_name": SourcePlatformEnum.KLAVIYO.value,
            "limit": IntegrationLimit.KLAVIYO.value,
        }

        if common_integration:
            integration_data["user_id"] = user.get("id")
        else:
            integration_data["domain_id"] = domain_id

        integartion = self.integrations_persisntece.create_integration(
            integration_data
        )

        if not integartion:
            raise HTTPException(
                status_code=409,
                detail={"status": IntegrationsStatus.CREATE_IS_FAILED.value},
            )

        return integartion

    def __mapped_list(self, list) -> KlaviyoList:
        return KlaviyoList(id=list["id"], list_name=list["attributes"]["name"])

    def get_list(self, domain_id: int, user_id: int):
        credentials = self.get_credentials(domain_id, user_id)
        if not credentials:
            return
        return self.__get_list(credentials.access_token, credentials)

    def __get_list(self, access_token: str, credential=None):
        response = self.client.get(
            "https://a.klaviyo.com/api/lists/",
            headers={
                "Authorization": f"Klaviyo-API-Key {access_token}",
                "revision": "2023-08-15",
            },
        )
        if response.status_code == 401 and credential:
            credential.error_message = "Invalid API KEY"
            credential.is_failed = True
            self.integrations_persisntece.db.commit()
            return
        return [
            self.__mapped_list(list) for list in response.json().get("data")
        ]

    def __get_tags(self, access_token: str, credential):
        response = self.__handle_request(
            method="GET",
            url="https://a.klaviyo.com/api/tags/",
            api_key=access_token,
        )
        if response.status_code == 401 and credential:
            credential.error_message = "Invalid API KEY"
            credential.is_failed = True
            self.integrations_persisntece.db.commit()
            return
        return [self.__mapped_tags(tag) for tag in response.json().get("data")]

    def get_tags(self, domain_id: int, user: dict):
        credentials = self.get_credentials(domain_id, user.get("id"))
        return self.__get_tags(credentials.access_token, credentials)

    def create_tags(self, tag_name: str, domain_id: int, user: dict):
        credential = self.get_credentials(domain_id, user.get("id"))
        response = self.__handle_request(
            method="POST",
            url="https://a.klaviyo.com/api/tags/",
            api_key=credential.access_token,
            json=self.__mapped_tags_json_to_klaviyo(tag_name),
        )
        if response.status_code == 201 or response.status_code == 200:
            return self.__mapped_tags(response.json().get("data"))
        elif response.status_code == 401:
            credential.error_message = "Invalid API Key"
            credential.is_failed = True
            self.integrations_persisntece.db.commit()
            raise HTTPException(
                status_code=400,
                detail={"status": IntegrationsStatus.CREATE_IS_FAILED.value},
            )

    def edit_sync(
        self,
        leads_type: str,
        integrations_users_sync_id: int,
        domain_id: int,
        created_by: str,
        user_id: int,
        data_map: List[DataMap] = [],
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

    def create_list(self, list, domain_id: int, user_id: int):
        credential = self.get_credentials(domain_id, user_id)
        response = self.client.post(
            "https://a.klaviyo.com/api/lists",
            headers={
                "Authorization": f"Klaviyo-API-Key {credential.access_token}",
                "revision": "2024-07-15",
                "accept": "application/json",
                "content-type": "application/json",
            },
            data=json.dumps(
                {"data": {"type": "list", "attributes": {"name": list.name}}}
            ),
        )
        if response.status_code == 401:
            credential.error_message = "Invalid API Key"
            credential.is_failed = True
            self.integrations_persisntece.db.commit()
            raise HTTPException(
                status_code=400,
                detail={"status": IntegrationsStatus.CREATE_IS_FAILED.value},
            )
        return self.__mapped_list(response.json().get("data"))

    def test_api_key(self, access_token: str):
        json_data = {
            "data": {
                "type": "profile",
                "attributes": {
                    "email": "test",
                    "first_name": "Test",
                    "last_name": "Test",
                },
            }
        }
        response = self.__handle_request(
            method="POST",
            url="https://a.klaviyo.com/api/profiles/",
            api_key=access_token,
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
            if self.test_api_key(credentials.klaviyo.api_key) == False:
                raise HTTPException(
                    status_code=400,
                    detail=IntegrationsStatus.CREDENTAILS_INVALID.value,
                )
        except:
            raise HTTPException(
                status_code=400,
                detail=IntegrationsStatus.CREDENTAILS_INVALID.value,
            )
        integartions = self.__save_integrations(
            credentials.klaviyo.api_key,
            domain_id,
            user,
        )
        return {
            "integartions": integartions,
            "status": IntegrationsStatus.SUCCESS.value,
        }

    def create_tag_relationships_lists(
        self, tags_id: str, list_id: str, api_key: str
    ):
        self.__handle_request(
            method="POST",
            url=f"https://a.klaviyo.com/api/tags/{tags_id}/relationships/lists/",
            json={"data": [{"type": "list", "id": list_id}]},
            api_key=api_key,
        )

    def update_tag_relationships_lists(
        self, tags_id: str, list_id: str, api_key: str
    ):
        self.__handle_request(
            method="PUT",
            url=f"https://a.klaviyo.com/api/tags/{tags_id}/relationships/lists/",
            json={"data": [{"type": "list", "id": list_id}]},
            api_key=api_key,
        )

    async def create_sync(
        self,
        leads_type: str,
        list_id: str,
        list_name: str,
        domain_id: int,
        created_by: str,
        user: dict,
        tags_id: str = None,
        data_map: List[DataMap] = [],
    ):
        credentials = self.get_credentials(
            domain_id=domain_id, user_id=user.get("id")
        )
        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credentials.id,
                "list_id": list_id,
                "list_name": list_name,
                "domain_id": domain_id,
                "sent_contacts": -1,
                "sync_type": DataSyncType.CONTACT.value,
                "leads_type": leads_type,
                "data_map": data_map,
                "created_by": created_by,
            }
        )
        if tags_id:
            self.create_tag_relationships_lists(
                tags_id=tags_id,
                list_id=list_id,
                api_key=credentials.access_token,
            )

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: List[Tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
    ):
        sem = asyncio.Semaphore(10)
        ids_list = []

        async def process_single_lead(lead_user, five_x_five_user):
            async with sem:
                ids_list.append(lead_user.id)
                profile = await self.__create_profile(
                    lead_user,
                    five_x_five_user,
                    user_integration.access_token,
                    integration_data_sync.data_map,
                    is_email_validation_enabled,
                )
                if isinstance(profile, str):
                    return {"lead_id": lead_user.id, "status": profile}
                return {
                    "lead_id": lead_user.id,
                    "status": ProccessDataSyncResult.SUCCESS.value,
                    "profile": profile,
                }

        tasks = [
            process_single_lead(lead_user, five_x_five_user)
            for lead_user, five_x_five_user in user_data
        ]
        results = await asyncio.gather(*tasks)

        seen_ids = set()
        duplicates = []
        for p in profiles:
            pid = p.get("id")
            if pid in seen_ids:
                duplicates.append(pid)
            else:
                seen_ids.add(pid)

        if duplicates:
            print(f"Дубликаты профилей по id: {duplicates}")
        else:
            print("Дубликатов по id нет")

        successful = [
            result
            for result in results
            if result.get("status") == ProccessDataSyncResult.SUCCESS.value
        ]
        if successful:
            profiles_payload = [
                {
                    "id": result["profile"]["id"],
                    "email": result["profile"]["email"],
                    "phone_number": result["profile"]["phone_number"],
                }
                for result in successful
            ]

            print(len(profiles_payload))
            print(profiles_payload)

            list_response = await self.__add_profiles_to_list(
                list_id=integration_data_sync.list_id,
                profiles=profiles_payload,
                api_key=user_integration.access_token,
            )
            if list_response == ProccessDataSyncResult.LIST_NOT_EXISTS.value:
                for r in successful:
                    r["status"] = ProccessDataSyncResult.LIST_NOT_EXISTS.value

        return results

    def is_supported_region(self, phone_number: str) -> bool:
        return phone_number.startswith("+1")

    def get_count_profiles(self, list_id: str, api_key: str):
        url = f"https://a.klaviyo.com/api/lists/{list_id}?additional-fields[list]=profile_count"
        response = self.__handle_request(
            method="GET",
            url=url,
            api_key=api_key,
        )
        if response.status_code == 200:
            data = response.json()
            return (
                data.get("data", {})
                .get("attributes", {})
                .get("profile_count", 0)
            )

        if response.status_code == 404:
            return ProccessDataSyncResult.LIST_NOT_EXISTS.value

        if response.status_code == 401:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value

        if response.status_code == 429:
            return ProccessDataSyncResult.TOO_MANY_REQUESTS.value

    async def log_response_to_file(self, response, lead_user_id=None):
        def write():
            status_code = getattr(response, "status_code", None)
            content = None
            try:
                content = response.json()
            except (ValueError, json.JSONDecodeError):
                content = response.text if hasattr(response, "text") else None
            log_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "lead_user_id": lead_user_id,
                "status_code": status_code,
                "response": content,
            }
            with open(
                "tmp/profile_sync_responses.log", "a", encoding="utf-8"
            ) as f:
                f.write(json.dumps(log_data, ensure_ascii=False) + "\n")

        await asyncio.to_thread(write)

    async def __create_profile(
        self,
        lead_user,
        five_x_five_user,
        api_key: str,
        data_map,
        is_email_validation_enabled: bool,
    ):
        profile = await self.__mapped_klaviyo_profile(
            five_x_five_user, is_email_validation_enabled
        )
        if profile in (
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
        ):
            return profile

        if data_map:
            properties = await self.__map_properties(five_x_five_user, data_map)
        else:
            properties = {}

        phone_number = validate_and_format_phone(profile.phone_number)
        phone_number = phone_number.split(", ")[-1] if phone_number else None
        json_data = {
            "data": {
                "type": "profile",
                "attributes": {
                    "email": profile.email,
                    "phone_number": phone_number,
                    "first_name": profile.first_name or None,
                    "last_name": profile.last_name or None,
                    "organization": profile.organization or None,
                    "location": profile.location or None,
                    "title": profile.title or None,
                    "properties": properties,
                },
            }
        }
        json_data["data"]["attributes"] = {
            k: v
            for k, v in json_data["data"]["attributes"].items()
            if v is not None
        }
        email = profile.email
        check_response = await self.__async_handle_request(
            method="GET",
            url=f'https://a.klaviyo.com/api/profiles/?filter=equals(email,"{email}")',
            api_key=api_key,
        )
        await self.log_response_to_file(
            lead_user_id=lead_user.id, response=check_response
        )
        if isinstance(check_response, dict):
            if check_response.get("error"):
                return ProccessDataSyncResult.TOO_MANY_REQUESTS.value

        if check_response.status_code == 200 and check_response.json().get(
            "data"
        ):
            profile_id = check_response.json()["data"][0]["id"]
            json_data["data"]["id"] = profile_id
            response = await self.__async_handle_request(
                method="PATCH",
                url=f"https://a.klaviyo.com/api/profiles/{profile_id}",
                api_key=api_key,
                json=json_data,
            )
        else:
            response = await self.__async_handle_request(
                method="POST",
                url="https://a.klaviyo.com/api/profiles/",
                api_key=api_key,
                json=json_data,
            )

        await self.log_response_to_file(
            lead_user_id=lead_user.id, response=response
        )
        if isinstance(response, dict):
            if check_response.get("error"):
                return ProccessDataSyncResult.TOO_MANY_REQUESTS.value

        if response.status_code in (200, 201):
            return {
                **response.json().get("data", {}),
                "phone_number": phone_number,
                "email": profile.email,
            }
        if response.status_code == 400:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value
        if response.status_code == 401:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        if response.status_code == 409:
            return {
                "id": response.json()
                .get("errors")[0]
                .get("meta")
                .get("duplicate_profile_id"),
                "phone_number": phone_number,
                "email": profile.email,
            }

    async def __add_profiles_to_list(
        self,
        list_id: str,
        profiles: List[Dict[str, Any]],
        api_key: str,
    ):
        def chunks(lst, n):
            for i in range(0, len(lst), n):
                yield lst[i : i + n]

        async def send_batch(batch):
            ids = [{"type": "profile", "id": p["id"]} for p in batch]
            resp = await self.__async_handle_request(
                method="POST",
                url=f"https://a.klaviyo.com/api/lists/{list_id}/relationships/profiles/",
                api_key=api_key,
                json={"data": ids},
            )
            await self.log_response_to_file(response=resp)
            return resp

        for batch in chunks(profiles, 100):
            resp = await send_batch(batch)
            if resp.status_code == 404:
                return ProccessDataSyncResult.LIST_NOT_EXISTS.value

        return ProccessDataSyncResult.SUCCESS.value

    def set_suppression(self, suppression: bool, domain_id: int, user: dict):
        credential = self.get_credentials(domain_id, user.get("id"))
        if not credential:
            raise HTTPException(
                status_code=403,
                detail=IntegrationsStatus.CREDENTIALS_NOT_FOUND.value,
            )
        credential.suppression = suppression
        self.integrations_persisntece.db.commit()
        return {"message": "successfuly"}

    def get_profile(
        self,
        domain_id: int,
        fields: List[ContactFiled],
        date_last_sync: str = None,
    ) -> List[ContactSuppression]:
        credentials = self.get_credentials(domain_id)
        if not credentials:
            raise HTTPException(
                status_code=403,
                detail=IntegrationsStatus.CREDENTIALS_NOT_FOUND.value,
            )
        params = {
            "fields[profile]": ",".join(fields),
        }
        if date_last_sync:
            params["filter"] = f"greater-than(created,{date_last_sync})"
        response = self.__handle_request(
            method="GET",
            url="https://a.klaviyo.com/api/profiles/",
            api_key=credentials.access_token,
            params=params,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "Profiles from Klaviyo could not be retrieved"
                },
            )
        return [
            self.__mapped_profile_from_klaviyo(profile)
            for profile in response.json().get("data")
        ]

    async def __mapped_klaviyo_profile(
        self, five_x_five_user: FiveXFiveUser, is_email_validation_enabled: bool
    ) -> KlaviyoProfile:
        if is_email_validation_enabled:
            first_email = get_valid_email(
                five_x_five_user, self.million_verifier_integrations
            )
        else:
            first_email = get_valid_email_without_million(five_x_five_user)

        if first_email in (
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
        ):
            return first_email

        first_phone = (
            getattr(five_x_five_user, "mobile_phone")
            or getattr(five_x_five_user, "personal_phone")
            or getattr(five_x_five_user, "direct_number")
            or getattr(five_x_five_user, "company_phone", None)
        )

        location = {
            "address1": getattr(five_x_five_user, "personal_address")
            or getattr(five_x_five_user, "company_address", None),
            "city": getattr(five_x_five_user, "personal_city")
            or getattr(five_x_five_user, "company_city", None),
            "region": getattr(five_x_five_user, "personal_state")
            or getattr(five_x_five_user, "company_state", None),
            "zip": getattr(five_x_five_user, "personal_zip")
            or getattr(five_x_five_user, "company_zip", None),
        }
        return KlaviyoProfile(
            email=first_email,
            phone_number=format_phone_number(first_phone),
            first_name=getattr(five_x_five_user, "first_name", None),
            last_name=getattr(five_x_five_user, "last_name", None),
            organization=getattr(five_x_five_user, "company_name", None),
            location=location,
            title=getattr(five_x_five_user, "job_title", None),
        )

    async def __map_properties(
        self, five_x_five_user: FiveXFiveUser, data_map: List[DataMap]
    ) -> dict:
        properties = {}
        for mapping in data_map:
            five_x_five_field = mapping.get("type")
            new_field = mapping.get("value")
            value_field = getattr(five_x_five_user, five_x_five_field, None)

            if value_field is not None:
                properties[new_field] = (
                    value_field.isoformat()
                    if isinstance(value_field, datetime)
                    else value_field
                )
            else:
                properties[new_field] = None

        mapped_fields = {mapping.get("value") for mapping in data_map}
        if "Time on site" in mapped_fields or "URL Visited" in mapped_fields:
            time_on_site, url_visited = self.leads_persistence.get_visit_stats(
                five_x_five_user.id
            )
        if "Time on site" in mapped_fields:
            properties["Time on site"] = time_on_site
        if "URL Visited" in mapped_fields:
            properties["URL Visited"] = url_visited

        return properties

    def __mapped_tags(self, tag: dict):
        return KlaviyoTags(
            id=tag.get("id"), tag_name=tag.get("attributes").get("name")
        )

    def __mapped_tags_json_to_klaviyo(self, tag_name: str):
        return {"data": {"type": "tag", "attributes": {"name": tag_name}}}

    def __mapped_profile_from_klaviyo(self, profile):
        return ContactSuppression(
            id=profile.get("id"),
            email=profile.get("attributes").get("email"),
            phone_number=profile.get("attributes").get("phone_number"),
        )
