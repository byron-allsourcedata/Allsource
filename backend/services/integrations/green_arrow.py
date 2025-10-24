import base64
import json
import logging
import os
import requests
from typing import List, Tuple
from datetime import datetime
from fastapi import HTTPException

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
    ):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations

    def _auth_headers(self, api_key: str):
        token = base64.b64encode(f"{api_key}:".encode()).decode()
        return {
            "Authorization": f"Basic {token}",
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
        """
        list_data: объект с .name и опциональными полями от вашего UI.
        Требуется credentials: access_token (api_key) и base_url (data_center аналог).
        """
        credential = self.get_credentials(domain_id, user_id)
        if not credential:
            raise Exception("Missing credentials")

        api_key = credential.access_token
        base_url = (
            credential.data_center
        )  # используем data_center поле для base_url
        url = f"{self._base_api(base_url)}/mailing_lists"

        payload = {
            "mailing_list": {
                "name": list_data.name,
                "d_from_email": "noreply@allsourcedata.io",
                "d_from_name": "Allsource",
                # добавьте остальные желаемые defaults...
            }
        }

        headers = self._auth_headers(api_key)
        resp = requests.post(
            url, headers=headers, data=json.dumps(payload), timeout=30
        )

        if resp.status_code == 401:
            credential.error_message = "Invalid API Key"
            credential.is_failed = True
            self.integrations_persisntece.db.commit()
            return {"status": "CREDENTIALS_INVALID"}

        if not resp.ok:
            logging.error(
                "GreenArrow create_list failed: %s %s",
                resp.status_code,
                resp.text,
            )
            return {"status": "CREATE_IS_FAILED", "detail": resp.text}

        data = resp.json().get("data")
        list_id = data.get("id")
        # создать стандартные custom fields (пример)
        custom_fields = [
            {"custom_field": {"name": "Company Domain", "field_type": "text"}},
            {"custom_field": {"name": "Company SIC", "field_type": "text"}},
            # ... добавьте остальные
        ]
        for cf in custom_fields:
            try:
                cf_url = f"{self._base_api(base_url)}/mailing_lists/{list_id}/custom_fields"
                r = requests.post(
                    cf_url, headers=headers, data=json.dumps(cf), timeout=20
                )
                # если уже есть — игнорировать
            except Exception as e:
                logging.warning("Failed to create custom field: %s", e)

        return {"id": list_id, "list_name": data.get("name")}

    def get_list(
        self,
        user_id: int,
        domain_id: int,
        api_key: str = None,
        base_url: str = None,
    ):
        if api_key and base_url:
            headers = self._auth_headers(api_key)
            url = f"{self._base_api(base_url)}/mailing_lists"
        else:
            credentials = self.get_credentials(domain_id, user_id)
            if not credentials:
                return []
            headers = self._auth_headers(credentials.access_token)
            url = f"{self._base_api(credentials.data_center)}/mailing_lists"

        resp = requests.get(url, headers=headers, timeout=20)
        if not resp.ok:
            # отметить ошибку в credentials, если есть
            if "credentials" in locals() and credentials:
                credentials.error_message = resp.text
                credentials.is_failed = True
                self.integrations_persisntece.db.commit()
            return []
        payload = resp.json()
        lists = payload.get("data", [])
        return [{"id": l["id"], "list_name": l["name"]} for l in lists]

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

        integration_data = {
            "access_token": api_key,
            "data_center": base_url,
            "full_name": user.get("full_name"),
            "service_name": SourcePlatformEnum.GREEN_ARROW.value,
            "limit": None,
        }

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
                "sync_type": "CONTACT",
                "leads_type": leads_type,
                "data_map": data_map,
                "created_by": created_by,
            }
        )
        return sync

    def sync_contacts_bulk(
        self, list_id: str, profiles_list: List[dict], user_integration
    ):
        """
        profiles_list: список dict, где ключи: email, status, custom_fields (dict), и т.д.
        Мы формируем JSON import и POST /mailing_lists/:id/subscriber_imports
        """
        api_key = user_integration.access_token
        base_url = user_integration.data_center
        url = f"{self._base_api(base_url)}/mailing_lists/{list_id}/subscriber_imports"
        headers = self._auth_headers(api_key)

        # column_mapping должен отражать порядок полей в content
        # удобнее: используем JSON file_source с кусочной строкой CSV или json content
        # тут пример простейшего json content: одна колонка email + custom fields — используйте CSV если удобнее
        rows = []
        for p in profiles_list:
            # преобразуйте profile -> строка CSV или JSON по колонкам
            # простой вариант: csv with headers
            rows.append(p)  # предполагаем p уже словарь со всеми ключами

        # подготовим json content как CSV (в простейшей форме) или как JSON lines:
        # используем 'type':'json' и content — GreenArrow примеры показывают строку с newline
        # Формируем CSV с headers из keys of first dict
        if not rows:
            return "NO_PROFILES"

        keys = list(rows[0].keys())
        lines = [",".join(keys)]
        for r in rows:
            line_vals = []
            for k in keys:
                val = r.get(k, "")
                if isinstance(val, dict):
                    val = json.dumps(val)
                if val is None:
                    val = ""
                # escape quotes
                v = str(val).replace('"', '""')
                line_vals.append(f'"{v}"')
            lines.append(",".join(line_vals))
        csv_content = "\n".join(lines)

        payload = {
            "subscriber_import": {
                "begins_at": "now",
                "column_mapping": keys,
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

        resp = requests.post(
            url, headers=headers, data=json.dumps(payload), timeout=60
        )
        if not resp.ok:
            logging.error(
                "GreenArrow subscriber_import failed: %s %s",
                resp.status_code,
                resp.text,
            )
            return "AUTH_FAILED_OR_ERROR"
        import_data = resp.json().get("data")
        return {"status": "SUCCESS", "import_id": import_data.get("id")}

    # --- create / update отдельных подписчиков (если нужно) ---
    def __create_or_update_subscriber(
        self, user_integration, list_id: str, profile: dict
    ):
        api_key = user_integration.access_token
        base_url = user_integration.data_center
        url = f"{self._base_api(base_url)}/mailing_lists/{list_id}/subscribers"
        headers = self._auth_headers(api_key)
        payload = {
            "subscriber": {
                "email": profile.get("email"),
                "status": profile.get("status", "active"),
                "custom_fields": profile.get("custom_fields", {}),
            }
        }
        resp = requests.post(
            url, headers=headers, data=json.dumps(payload), timeout=20
        )
        if not resp.ok:
            logging.error(
                "create_or_update_subscriber failed: %s %s",
                resp.status_code,
                resp.text,
            )
            return False, resp.text
        return True, resp.json().get("data")

    # --- mapping / helper methods аналогичные Mailchimp ---
    def __mapped_list(self, list_obj):
        return {"id": list_obj["id"], "list_name": list_obj["name"]}

    def __mapped_member_into_list(
        self, enrichment_user, target_schema, validations, data_map
    ):
        # Ваша логика маппинга должна быть идентична Mailchimp версии:
        # формируете dict с keys: email, status, custom_fields: {...}
        # возвращаете dict или ошибку формата
        ...
