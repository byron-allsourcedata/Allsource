from datetime import date, datetime
import json
import logging
import os
import httpx
from typing import Annotated, List, Tuple
from fastapi import Depends, HTTPException

from models.leads_users import LeadUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import (
    IntegrationsPersistence,
)
from enums import (
    IntegrationsStatus,
    SourcePlatformEnum,
    ProccessDataSyncResult,
    DataSyncType,
    IntegrationLimit,
)
from utils import (
    format_phone_number,
    get_http_client,
    get_valid_email,
    get_valid_email_without_million,
    get_valid_phone,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence, FiveXFiveUser
from resolver import injectable
from schemas.integrations.integrations import *
from services.integrations.commonIntegration import *
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)


@injectable
class GreenArrowIntegrationsService:
    BASE_URL = "https://b2bpipes.com/ga/api/v2"

    def __init__(
        self,
        domain_persistence: UserDomainsPersistence,
        integrations_persistence: IntegrationsPersistence,
        leads_persistence: LeadsPersistence,
        sync_persistence: IntegrationsUserSyncPersistence,
        million_verifier_integrations: MillionVerifierIntegrationsService,
        client: Annotated[httpx.Client, Depends(get_http_client)],
    ):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.client = client

    def _auth_headers(self, api_key: str):
        return {
            "Authorization": f"Basic {api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def get_credentials(self, domain_id: int, user_id: int):
        return self.integrations_persisntece.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.GREEN_ARROW.value,
        )

    def create_list(self, list_data, domain_id: int, user_id: int):
        credential = self.get_credentials(domain_id, user_id)
        if not credential:
            raise Exception("Missing credentials")

        api_key = credential.access_token
        url = f"{self.BASE_URL}/mailing_lists"
        headers = self._auth_headers(api_key)

        resp = self.client.post(
            url,
            headers=headers,
            data=json.dumps({"mailing_list": {"name": list_data.name}}),
        )

        if resp.status_code == 401:
            credential.error_message = "Invalid API Key"
            credential.is_failed = True
            self.integrations_persisntece.db.commit()
            return {"status": "CREDENTIALS_INVALID"}

        if not resp.status_code == 200:
            logging.error(
                "GreenArrow create_list failed: %s %s",
                resp.status_code,
                resp.text,
            )
            return {"status": "CREATE_IS_FAILED", "detail": resp.text}

        data = resp.json().get("data")
        list_id = data.get("id")

        return ListFromIntegration(id=str(list_id), list_name=data.get("name"))

    def get_list(
        self,
        user_id: int,
        domain_id: int,
        api_key: str = None,
        base_url: str = None,
    ):
        if api_key and base_url:
            headers = self._auth_headers(api_key)
        else:
            credentials = self.get_credentials(domain_id, user_id)
            if not credentials:
                return []
            headers = self._auth_headers(credentials.access_token)

        url = f"{self.BASE_URL}/mailing_lists"
        resp = self.client.get(url, headers=headers)

        if not resp.status_code == 200:
            if "credentials" in locals() and credentials:
                credentials.error_message = resp.text
                credentials.is_failed = True
                self.integrations_persisntece.db.commit()
            return []
        payload = resp.json()

        lists = payload.get("data") or []
        result = []
        for l in lists:
            lid = l.get("id", None)
            name = l.get("name", None)
            if lid is not None:
                result.append({"id": str(lid), "list_name": name})
        return result

    def __save_integation(
        self, domain_id: int, api_key: str, base_url: str, user: dict
    ):
        credential = self.get_credentials(
            domain_id=domain_id, user_id=user.get("id")
        )
        if credential:
            credential.access_token = api_key
            credential.data_center = base_url
            credential.is_failed = False
            self.integrations_persisntece.db.commit()
            return credential

        common_integration = os.getenv("COMMON_INTEGRATION") == "True"
        integration_data = {
            "access_token": api_key,
            "data_center": base_url,
            "full_name": user.get("full_name"),
            "service_name": SourcePlatformEnum.GREEN_ARROW.value,
            "limit": None,
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
                status_code=409, detail={"status": "CREATE_IS_FAILED"}
            )
        return integartion

    def add_integration(
        self, credentials: IntegrationCredentials, domain, user: dict
    ):
        domain_id = domain.id if domain else None
        api_key = credentials.green_arrow.api_key
        base_url = self.BASE_URL
        # try:
        #     lists = self.get_list(
        #         api_key=api_key,
        #         domain_id=domain_id,
        #         user_id=user.get("id"),
        #         base_url=base_url,
        #     )
        #     if lists is None:
        #         raise Exception("Invalid")
        # except Exception:
        #     raise HTTPException(
        #         status_code=200, detail={"status": "CREDENTIALS_INVALID"}
        #     )

        integration = self.__save_integation(
            domain_id=domain_id, api_key=api_key, base_url=base_url, user=user
        )
        return integration

    async def create_sync(
        self,
        domain_id: int,
        leads_type: str,
        list_id: str,
        list_name: str,
        data_map: List[dict],
        created_by: str,
        user: dict,
    ):
        credentials = self.get_credentials(
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

    async def _ensure_custom_fields_exist(
        self,
        list_id: str,
        needed_fields: List[str],
        api_key: str,
        base_url: str,
    ):
        headers = self._auth_headers(api_key)
        base = base_url.rstrip("/")
        get_url = f"{base}/mailing_lists/{list_id}/custom_fields"

        resp = self.client.get(get_url, headers=headers)

        if resp.status_code not in (200, 201):
            logging.warning(
                "Failed to GET custom_fields: %s %s",
                resp.status_code,
                resp.text,
            )
            existing = set()
        else:
            body = resp.json()
            fields = (
                body.get("data")
                if isinstance(body, dict) and body.get("data") is not None
                else (body if isinstance(body, list) else [])
            )
            existing = set()
            for f in fields:
                if isinstance(f, dict):
                    name = f.get("name") or f.get("key") or f.get("field_name")
                    if name:
                        existing.add(name)

        builtin = {"email", "status", "confirmed", "format"}
        to_create = [
            f for f in needed_fields if f not in existing and f not in builtin
        ]

        for field_name in to_create:
            post_url = f"{base}/mailing_lists/{list_id}/custom_fields"
            payload = {
                "custom_field": {"name": field_name, "field_type": "text"}
            }
            try:
                r = self.client.post(post_url, headers=headers, json=payload)
            except httpx.RequestError as e:
                logging.warning(
                    "Network error creating custom_field %s: %s", field_name, e
                )
                continue
            if r.status_code in (200, 201):
                existing.add(field_name)
            else:
                logging.warning(
                    "Failed to create custom_field %s: %s %s",
                    field_name,
                    r.status_code,
                    r.text,
                )
        return existing

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: List[Tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
    ):
        profiles = []
        results = []

        for lead_user, five_x_five_user in user_data:
            profile = await self.__map_lead_to_green_arrow_contact(
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

            results.append(
                {
                    "lead_id": lead_user.id,
                    "status": ProccessDataSyncResult.SUCCESS.value,
                }
            )
            profiles.append(profile)

        if not profiles:
            return results

        try:
            import_response = await self.sync_contacts_bulk(
                integration_data_sync.list_id,
                profiles,
                integration_data_sync,
                user_integration,
            )
        except Exception as exc:
            logging.error("Exception during sync_contacts_bulk: %s", exc)
            import_response = "AUTH_FAILED_OR_ERROR"

        create_profile_result = None

        if isinstance(import_response, dict):
            status = import_response.get("status")
            if status == "SUCCESS":
                create_profile_result = ProccessDataSyncResult.SUCCESS.value
            elif status == "RATE_LIMITED":
                create_profile_result = (
                    ProccessDataSyncResult.AUTHENTICATION_FAILED.value
                )
            else:
                create_profile_result = (
                    ProccessDataSyncResult.AUTHENTICATION_FAILED.value
                )
        else:
            if import_response in ("AUTH_FAILED", "AUTH_FAILED_OR_ERROR"):
                create_profile_result = (
                    ProccessDataSyncResult.AUTHENTICATION_FAILED.value
                )
            elif import_response == "NO_PROFILES":
                create_profile_result = (
                    ProccessDataSyncResult.INCORRECT_FORMAT.value
                )
            else:
                create_profile_result = (
                    ProccessDataSyncResult.AUTHENTICATION_FAILED.value
                )

        if create_profile_result in (
            ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.LIST_NOT_EXISTS.value,
        ):
            for res in results:
                if res["status"] == ProccessDataSyncResult.SUCCESS.value:
                    res["status"] = create_profile_result

        return results

    async def __map_lead_to_green_arrow_contact(
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
            "custom_variables": {
                **{
                    "First Name": getattr(five_x_five_user, "first_name", None),
                    "Last Name": getattr(five_x_five_user, "last_name", None),
                    "Phone": format_phone_number(phone),
                },
                **{
                    field["value"]: (
                        getattr(
                            five_x_five_user, field["type"], None
                        ).isoformat()
                        if isinstance(
                            getattr(five_x_five_user, field["type"], None),
                            (datetime, date),
                        )
                        else getattr(five_x_five_user, field["type"], None)
                    )
                    for field in data_map
                },
            },
        }

    async def sync_contacts_bulk(
        self,
        list_id: str,
        profiles_list: List[dict],
        integration_data_sync: IntegrationUserSync,
        user_integration: UserIntegration,
    ):
        if not profiles_list:
            return "NO_PROFILES"

        api_key = user_integration.access_token
        base_url = (user_integration.data_center or self.BASE_URL).rstrip("/")
        url = f"{base_url}/mailing_lists/{list_id}/subscriber_imports"
        headers = self._auth_headers(api_key)

        flat_rows = []
        all_keys = set()
        for p in profiles_list:
            row = {}
            for k in ("email", "status"):
                if k in p and p[k] is not None:
                    row[k] = p[k]
                    all_keys.add(k)
            custom_vars = p.get("custom_variables") or {}
            if isinstance(custom_vars, dict):
                for ck, cv in custom_vars.items():
                    row[ck] = cv
                    all_keys.add(ck)
            for k2, v2 in p.items():
                if k2 in row or k2 == "custom_variables":
                    continue
                row[k2] = v2
                all_keys.add(k2)
            flat_rows.append(row)

        existing_fields = await self._ensure_custom_fields_exist(
            list_id, list(all_keys), api_key, base_url
        )

        builtin = {"email", "status", "confirmed", "format"}
        filtered_ordered = []
        missing_fields = []
        for k in all_keys:
            if k in builtin or k in existing_fields:
                filtered_ordered.append(k)
            else:
                missing_fields.append(k)

        if missing_fields:
            logging.warning(
                "Some fields are not available on list %s and will be omitted: %s",
                list_id,
                missing_fields,
            )

        if not filtered_ordered:
            logging.error(
                "No valid columns to import after filtering; aborting import."
            )
            return {"status": "ERROR", "error_message": "no_valid_columns"}

        lines = [",".join(filtered_ordered)]
        for r in flat_rows:
            vals = []
            for key in filtered_ordered:
                val = r.get(key, "")
                if isinstance(val, (dict, list)):
                    val = json.dumps(val, ensure_ascii=False)
                if val is None:
                    val = ""
                s = str(val).replace('"', '""')
                vals.append(f'"{s}"')
            lines.append(",".join(vals))
        csv_content = "\n".join(lines)

        payload = {
            "subscriber_import": {
                "begins_at": "now",
                "column_mapping": filtered_ordered,
                "file_source": {"type": "json", "content": csv_content},
                "file_format": {
                    "character_set": "utf-8",
                    "csv_has_headers": True,
                    "csv_field_separator": ",",
                    "csv_field_enclosure": '"',
                    "date_format": "mdy",
                },
                "overwrite": True,
                "overwrite_what": {
                    "custom_fields": True,
                    "confirmed": False,
                    "format": False,
                    "status": False,
                },
                "subscriber_defaults": {
                    "status": "active",
                    "confirmed": True,
                    "format": "html",
                },
            }
        }

        try:
            resp = self.client.post(
                url, headers=headers, json=payload, timeout=60.0
            )
        except Exception as exc:
            logging.error("HTTP error when starting subscriber_import: %s", exc)
            return "AUTH_FAILED_OR_ERROR"

        if resp.status_code == 401:
            logging.error(
                "Authentication failed when starting subscriber_import: %s",
                resp.text,
            )
            return "AUTH_FAILED"
        if resp.status_code == 429:
            ra = resp.headers.get("Retry-After")
            logging.error(
                "Rate limited when starting subscriber_import: %s, Retry-After=%s",
                resp.text,
                ra,
            )
            return {"status": "RATE_LIMITED", "retry_after": ra}
        if not (200 <= resp.status_code < 300):
            logging.error(
                "GreenArrow subscriber_import failed HTTP %s: %s",
                resp.status_code,
                resp.text,
            )
            try:
                body = resp.json()
                err_code = body.get("error_code")
                err_msg = body.get("error_message")
                return {
                    "status": "ERROR",
                    "error_code": err_code,
                    "error_message": err_msg,
                }
            except Exception:
                return "AUTH_FAILED_OR_ERROR"

        try:
            body = resp.json()
        except Exception:
            logging.error(
                "Invalid JSON in subscriber_import response: %s",
                resp.text[:1000],
            )
            return "AUTH_FAILED_OR_ERROR"

        import_id = None
        if isinstance(body, dict):
            data_obj = body.get("data") or body.get("subscriber_import") or body
            if isinstance(data_obj, dict):
                import_id = data_obj.get("id") or data_obj.get("import_id")
        if import_id is None:
            logging.warning(
                "subscriber_import response parsed but no import id found. response body: %s",
                json.dumps(body)[:1000],
            )
            return {"status": "ERROR", "body": body}

        return {"status": "SUCCESS", "import_id": import_id}
