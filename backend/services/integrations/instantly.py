import asyncio
import logging
import os
import requests
from datetime import date, datetime
from typing import Tuple

from fastapi import HTTPException

from enums import (
    IntegrationsStatus,
    SourcePlatformEnum,
    ProccessDataSyncResult,
    DataSyncType,
    IntegrationLimit,
)
from models import LeadUser
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

        headers["Authorization"] = f"Bearer {api_key}"

        try:
            response = self.client.request(
                method=method,
                url=url,
                headers=headers,
                json=json,
                data=data,
                params=params,
            )
        except requests.RequestException:
            logging.exception("HTTP request failed: %s %s", method, url)
            raise
        return response

    def _is_name_validation_error(self, list_error_body, http_status):
        if http_status in (400, 422):
            try:
                if isinstance(list_error_body, dict):
                    msg = (
                        list_error_body.get("message")
                        or list_error_body.get("error")
                        or ""
                    )
                else:
                    msg = str(list_error_body)
            except Exception:
                msg = str(list_error_body)
            msg = (msg or "").lower()
            if "name" in msg and (
                "must be string" in msg
                or "required property 'name'" in msg
                or "body/name" in msg
            ):
                return True
        return False

    def _get_credentials(self, domain_id: int, user_id: int):
        return self.integrations_persistence.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.INSTANTLY.value,
        )

    def _save_integration_record(self, api_key: str, domain_id, user: dict):
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

    def add_integration(
        self, credentials: IntegrationCredentials, domain, user: dict
    ):
        api_key = credentials.instantly.api_key
        domain_id = domain.id if domain else None

        class Temp:
            pass

        list_data = Temp()
        list_data.name = {}

        list_resp = self.create_list(
            list_data=list_data,
            domain_id=domain_id,
            user_id=user.get("id"),
            api_key=api_key,
        )

        if isinstance(list_resp, dict):
            status = list_resp.get("status")
            http_status = list_resp.get("http_status")
            body = list_resp.get("body")

            if status == IntegrationsStatus.CREDENTIALS_INVALID.value:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "status": "Insufficient permissions for Create List",
                        "http_status": http_status,
                        "body": body,
                    },
                )

            if self._is_name_validation_error(
                body, http_status
            ) or http_status in (400, 422):
                get_list_resp = self.get_list(
                    user_id=user.get("id"), domain_id=domain_id, api_key=api_key
                )

                if (
                    get_list_resp
                    == ProccessDataSyncResult.AUTHENTICATION_FAILED.value
                ):
                    raise HTTPException(
                        status_code=403,
                        detail={
                            "status": "Insufficient permissions for Get Lists",
                        },
                    )

                ok, code = self.create_lead_single(
                    api_key=api_key, lead_payload={"email": ""}
                )

                if code == ProccessDataSyncResult.AUTHENTICATION_FAILED.value:
                    raise HTTPException(
                        status_code=403,
                        detail={
                            "status": "Insufficient permissions for Create Lead",
                        },
                    )
                if (
                    code
                    == ProccessDataSyncResult.PLATFORM_VALIDATION_FAILED.value
                ):
                    return self._save_integration_record(
                        api_key, domain_id, user
                    )

                raise HTTPException(
                    status_code=400,
                    detail={
                        "status": "CREATE_TEST_OBJECT_FAILED",
                        "list_error": {"http_status": http_status},
                        "lead_error": {"code": code},
                    },
                )

            raise HTTPException(
                status_code=400,
                detail={
                    "status": "CREATE_TEST_OBJECT_FAILED",
                    "list_error": {"http_status": http_status, "body": body},
                },
            )
        return self._save_integration_record(api_key, domain_id, user)

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

    def create_list(
        self, list_data, domain_id: int, user_id: int, api_key=None
    ):
        credentials = self._get_credentials(domain_id, user_id)

        payload = {"name": list_data.name}
        try:
            response = self.__handle_request(
                method="POST",
                url=f"{self.BASE_URL}/lead-lists",
                api_key=credentials.access_token
                if credentials
                else api_key
                if api_key
                else "",
                json=payload,
            )
        except requests.RequestException:
            if credentials:
                credentials.error_message = "Connection error"
                credentials.is_failed = True
                self.integrations_persistence.db.commit()
            return {"status": IntegrationsStatus.CREATE_IS_FAILED.value}

        try:
            body = response.json()
        except Exception:
            body = response.text

        if response.status_code in (200, 201, 202):
            return ListFromIntegration(id=body["id"], list_name=body["name"])
        if response.status_code in (401, 403):
            if credentials:
                credentials.error_message = (
                    "Invalid API Key or insufficient permissions"
                )
                credentials.is_failed = True
                self.integrations_persistence.db.commit()
            return {"status": IntegrationsStatus.CREDENTIALS_INVALID.value}
        return {
            "status": IntegrationsStatus.CREATE_IS_FAILED.value,
            "http_status": response.status_code,
            "body": body,
        }

    def get_list(self, user_id: int, domain_id: int, api_key: str = None):
        credentials = self._get_credentials(domain_id, user_id)

        try:
            response = self.__handle_request(
                method="GET",
                url=f"{self.BASE_URL}/lead-lists",
                api_key=credentials.access_token
                if credentials
                else api_key
                if api_key
                else "",
            )
            if response.status_code in (401, 403):
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
            data = response.json()
            lists = data["items"]
            if len(lists):
                return [
                    ListFromIntegration(id=l["id"], list_name=l["name"])
                    for l in lists
                ]
        except requests.HTTPError as e:
            if credentials:
                credentials.error_message = str(e)
                credentials.is_failed = True
                self.integrations_persistence.db.commit()
            return ProccessDataSyncResult.UNEXPECTED_ERROR.value

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: List[Tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
        requests_limit_per_minute: int = 60,
    ):
        interval = 60.0 / float(
            max(1, requests_limit_per_minute)
        )  # seconds between requests
        results = []

        list_id = (
            integration_data_sync.list_id
            if integration_data_sync.list_id
            else None
        )

        for lead_user, five_x_five_user in user_data:
            mapped = await self.__map_lead_to_instantly_contact(
                five_x_five_user,
                integration_data_sync.data_map,
                is_email_validation_enabled,
            )

            if mapped in (
                ProccessDataSyncResult.INCORRECT_FORMAT.value,
                ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
                ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
            ):
                results.append({"lead_id": lead_user.id, "status": mapped})
                # throttle between iterations anyway
                await asyncio.sleep(interval)
                continue

            payload = dict(mapped)
            if list_id:
                payload["list_id"] = list_id

            ok, info = await asyncio.to_thread(
                self.create_lead_single, payload, user_integration
            )
            logging.info(f"[PROCESS] success={ok} | status={info}")

            if ok:
                results.append(
                    {
                        "lead_id": lead_user.id,
                        "status": ProccessDataSyncResult.SUCCESS.value,
                    }
                )
            else:
                if info == ProccessDataSyncResult.AUTHENTICATION_FAILED.value:
                    results.append(
                        {
                            "lead_id": lead_user.id,
                            "status": ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
                        }
                    )
                    idx = user_data.index((lead_user, five_x_five_user))
                    remaining = user_data[idx + 1 :]
                    for future_lead, _ in remaining:
                        results.append(
                            {
                                "lead_id": future_lead.id,
                                "status": ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
                            }
                        )
                    return results
                elif (
                    info
                    == ProccessDataSyncResult.PLATFORM_VALIDATION_FAILED.value
                ):
                    results.append(
                        {
                            "lead_id": lead_user.id,
                            "status": ProccessDataSyncResult.INCORRECT_FORMAT.value,
                        }
                    )
                else:
                    results.append(
                        {
                            "lead_id": lead_user.id,
                            "status": ProccessDataSyncResult.PLATFORM_VALIDATION_FAILED.value,
                        }
                    )

            # throttle to respect requests_limit_per_minute
            # await asyncio.sleep(interval)

        return results

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
            "company_name": getattr(five_x_five_user, "company_name", None),
            "custom_variables": {
                field["value"]: (
                    getattr(five_x_five_user, field["type"], None).isoformat()
                    if isinstance(
                        getattr(five_x_five_user, field["type"], None),
                        (datetime, date),
                    )
                    else getattr(five_x_five_user, field["type"], None)
                )
                for field in data_map
            },
        }

    def create_lead_single(
        self, lead_payload, user_integration=None, api_key=None
    ):
        try:
            resp = self.__handle_request(
                method="POST",
                url=f"{self.BASE_URL}/leads",
                api_key=user_integration.access_token
                if user_integration
                else api_key
                if api_key
                else "",
                json=lead_payload,
            )
        except requests.RequestException as exc:
            logging.exception("create_lead_single: request exception: %s", exc)
            return False, ProccessDataSyncResult.UNEXPECTED_ERROR.value

        try:
            body = resp.json()
        except Exception:
            body = resp.text

        if resp.status_code in (200, 201, 202):
            return True, ProccessDataSyncResult.SUCCESS.value
        if resp.status_code in (401, 403):
            return False, ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        if resp.status_code in (400, 422):
            return (
                False,
                ProccessDataSyncResult.PLATFORM_VALIDATION_FAILED.value,
            )
        logging.error(
            "create_lead_single: unexpected %s %s", resp.status_code, body
        )
        return False, ProccessDataSyncResult.UNEXPECTED_ERROR.value

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
