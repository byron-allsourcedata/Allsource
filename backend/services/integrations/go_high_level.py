import logging
import os
from datetime import datetime
from typing import Tuple, Annotated
from db_dependencies import Db

import httpx
from fastapi import HTTPException, Depends

from config.util import getenv
from enums import (
    IntegrationsStatus,
    SourcePlatformEnum,
    ProccessDataSyncResult,
    DataSyncType,
    IntegrationLimit,
)
from models import FiveXFiveUser, LeadUser, UserDomains
from models.enrichment.enrichment_users import EnrichmentUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import (
    IntegrationsPersistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from resolver import injectable
from schemas.integrations.integrations import *
from services.integrations.commonIntegration import (
    resolve_main_email_and_phone,
    FIELD_FILLERS,
)
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from utils import (
    validate_and_format_phone,
    get_valid_email,
    get_valid_phone,
    get_valid_location,
    get_http_client,
    get_valid_email_without_million,
)

logger = logging.getLogger(__name__)


@injectable
class GoHighLevelIntegrationsService:
    def __init__(
        self,
        db: Db,
        domain_persistence: UserDomainsPersistence,
        integrations_persistence: IntegrationsPersistence,
        sync_persistence: IntegrationsUserSyncPersistence,
        client: Annotated[httpx.Client, Depends(get_http_client)],
        million_verifier_integrations: MillionVerifierIntegrationsService,
    ):
        self.domain_persistence = domain_persistence
        self.integrations_persistence = integrations_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.client = client
        self.TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token"
        self.VERSION = "2021-07-28"
        self.db = db

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
        response = self.client.request(
            method, url, headers=headers, json=json, data=data, params=params
        )
        return response

    def refresh_ghl_token(
        self, user_integration: UserIntegration
    ) -> str | None:
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "grant_type": "refresh_token",
            "refresh_token": user_integration.access_token,
            "client_id": os.getenv("CLIENT_GO_HIGH_LEVEL_ID"),
            "client_secret": os.getenv("CLIENT_GO_HIGH_LEVEL_SECRET"),
        }

        response = self.__handle_request(
            method="POST", url=self.TOKEN_URL, data=data, headers=headers
        )

        tokens = response.json()
        if not tokens.get("access_token"):
            logger.error(f"GHL refresh token failed: {tokens}")
            return None

        new_refresh_token = tokens.get("refresh_token")
        if new_refresh_token:
            user_integration.access_token = new_refresh_token
            self.db.commit()

        return tokens["access_token"]

    def get_credentials(self, domain_id: int, user_id: int):
        credential = self.integrations_persistence.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.GO_HIGH_LEVEL.value,
        )
        return credential

    def get_smart_credentials(self, user_id: int):
        credential = (
            self.integrations_persistence.get_smart_credentials_for_service(
                user_id=user_id,
                service_name=SourcePlatformEnum.GO_HIGH_LEVEL.value,
            )
        )
        return credential

    def __save_integrations(
        self, refresh_token: str, domain_id: int, user: dict, location_id: str
    ):
        credential = self.get_credentials(domain_id, user.get("id"))
        if credential:
            credential.access_token = refresh_token
            credential.location_id = location_id
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persistence.db.commit()
            return credential

        common_integration = os.getenv("COMMON_INTEGRATION") == "True"
        integration_data = {
            "access_token": refresh_token,
            "full_name": user.get("full_name"),
            "location_id": location_id,
            "service_name": SourcePlatformEnum.GO_HIGH_LEVEL.value,
            "limit": IntegrationLimit.GO_HIGH_LEVEL.value,
        }

        if common_integration:
            integration_data["user_id"] = user.get("id")
        else:
            integration_data["domain_id"] = domain_id

        integration = self.integrations_persistence.create_integration(
            integration_data
        )

        if not integration:
            raise HTTPException(
                status_code=409,
                detail={"status": IntegrationsStatus.CREATE_IS_FAILED.value},
            )

        return integration

    def edit_sync(
        self,
        leads_type: str,
        integrations_users_sync_id: int,
        domain_id: int,
        created_by: str,
        user_id: int,
        data_map: list[DataMap] = [],
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

    def add_integration(
        self,
        credentials: IntegrationCredentials,
        domain: UserDomains,
        user: dict,
    ):
        domain_id = domain.id if domain else None
        code = credentials.go_high_level.code
        data = {
            "grant_type": "authorization_code",
            "client_id": getenv("CLIENT_GO_HIGH_LEVEL_ID"),
            "client_secret": getenv("CLIENT_GO_HIGH_LEVEL_SECRET"),
            "code": code,
            "redirect_uri": f"{getenv('SITE_HOST_URL')}/high-landing",
        }
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        response = self.__handle_request(
            method="POST", url=self.TOKEN_URL, data=data, headers=headers
        )
        result = response.json()

        refresh_token = result.get("refresh_token")
        location_id = result["locationId"]
        if not refresh_token:
            raise HTTPException(
                status_code=400, detail="Failed to get access token"
            )

        integrations = self.__save_integrations(
            refresh_token=refresh_token,
            domain_id=domain_id,
            user=user,
            location_id=location_id,
        )
        return {
            "integrations": integrations,
            "status": IntegrationsStatus.SUCCESS.value,
        }

    async def create_sync(
        self,
        domain_id: int,
        leads_type: str,
        created_by: str,
        user: dict,
        data_map: list[DataMap] = [],
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
        created_by: str,
        user: dict,
        data_map: list[DataMap] = [],
    ):
        credentials = self.get_smart_credentials(user_id=user.get("id"))

        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credentials.id,
                "data_map": data_map,
                "sent_contacts": sent_contacts,
                "sync_type": DataSyncType.AUDIENCE.value,
                "smart_audience_id": smart_audience_id,
                "created_by": created_by,
            }
        )
        return sync

    def upsert_contact(self, access_token: str, contact_data: dict) -> dict:
        url = "https://services.leadconnectorhq.com/contacts/upsert"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Version": self.VERSION,
        }

        response = self.__handle_request(
            method="POST", url=url, json=contact_data, headers=headers
        )
        if response.status_code in (200, 201, 202):
            return ProccessDataSyncResult.SUCCESS.value

        return ProccessDataSyncResult.INCORRECT_FORMAT.value

    def list_custom_fields(self, access_token: str, location_id: str):
        url = f"https://services.leadconnectorhq.com/locations/{location_id}/customFields"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "Version": self.VERSION,
        }
        response = self.__handle_request(method="GET", url=url, headers=headers)
        if response.status_code != 200:
            logging.error(
                f"Failed to list custom fields: {response.status_code}, {response.text}"
            )
            return {}

        result = response.json()
        return {f["name"]: f for f in result.get("customFields", [])}

    def create_custom_field(
        self,
        access_token: str,
        location_id: str,
        key: str,
        field_type: str = "TEXT",
    ) -> dict:
        url = f"https://services.leadconnectorhq.com/locations/{location_id}/customFields"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "Version": self.VERSION,
        }
        response = self.__handle_request(
            method="POST",
            url=url,
            json={"name": key, "dataType": field_type},
            headers=headers,
        )
        if response.status_code == 401:
            raise HTTPException(
                status_code=401,
                detail={"status": IntegrationsStatus.CREDENTIALS_INVALID.value},
            )

        result = response.json()

        return result

    async def process_data_sync(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        enrichment_users: list[EnrichmentUser],
        target_schema: str,
        validations: dict = {},
    ):
        results = []
        access_token = self.refresh_ghl_token(user_integration)

        if not access_token:
            logging.error(
                f"GHL access token invalid for integration {user_integration.id}"
            )
            integration_data_sync.sync_status = False
            self.db.commit()
            return []

        for enrichment_user in enrichment_users:
            contact_data = self.__mapped_member_into_list(
                enrichment_user=enrichment_user,
                target_schema=target_schema,
                validations=validations,
                data_map=integration_data_sync.data_map,
                location_id=user_integration.location_id,
            )

            result = self.upsert_contact(
                access_token=access_token, contact_data=contact_data
            )
            results.append(
                {
                    "enrichment_user_asid": enrichment_user.asid,
                    "status": result,
                }
            )
            if result in (
                ProccessDataSyncResult.INCORRECT_FORMAT.value,
                ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
            ):
                continue

        return results

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: list[Tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
    ):
        results = []
        access_token = self.refresh_ghl_token(user_integration)

        if not access_token:
            logging.error(
                f"GHL access token is invalid for integration {user_integration.id}"
            )
            integration_data_sync.sync_status = False
            self.db.commit()
            return []

        for lead_user, five_x_five_user in user_data:
            contact_data = await self.__mapped_profile_lead(
                five_x_five_user=five_x_five_user,
                data_map=integration_data_sync.data_map,
                location_id=user_integration.location_id,
                access_token=access_token,
                is_email_validation_enabled=is_email_validation_enabled,
                lead_visit_id=lead_user.first_visit_id,
            )
            if contact_data in (
                ProccessDataSyncResult.INCORRECT_FORMAT.value,
                ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
            ):
                results.append(
                    {"lead_id": lead_user.id, "status": contact_data}
                )
                continue
            else:
                result = self.upsert_contact(
                    access_token=access_token, contact_data=contact_data
                )
                if result == ProccessDataSyncResult.INCORRECT_FORMAT.value:
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
                            "status": ProccessDataSyncResult.SUCCESS.value,
                        }
                    )

        return results

    async def __mapped_profile_lead(
        self,
        five_x_five_user: FiveXFiveUser,
        data_map: list,
        location_id: str,
        access_token: str,
        is_email_validation_enabled: bool,
        lead_visit_id: int,
    ) -> dict | str:
        # Email validation
        if is_email_validation_enabled:
            first_email = await get_valid_email(
                five_x_five_user, self.million_verifier_integrations
            )
        else:
            first_email = get_valid_email_without_million(five_x_five_user)

        first_name = getattr(five_x_five_user, "first_name", None)
        last_name = getattr(five_x_five_user, "last_name", None)

        if not first_name or not last_name:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        if first_email in (
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
        ):
            return first_email

        values_by_type = {
            "email": first_email,
            "first_name": first_name,
            "last_name": last_name,
            "gender": getattr(five_x_five_user, "gender", None),
            "company_name": getattr(five_x_five_user, "company_name", None),
            "phone": validate_and_format_phone(
                get_valid_phone(five_x_five_user)
            ),
            "address1": get_valid_location(five_x_five_user)[0],
            "city": get_valid_location(five_x_five_user)[1],
            "state": get_valid_location(five_x_five_user)[2],
            "visited_date": self.lead_persistence.get_visited_date(
                lead_visit_id
            )
            if any(f["type"] == "visited_date" for f in data_map)
            else None,
        }

        profile = {
            "email": first_email,
            "firstName": first_name,
            "lastName": last_name,
            "name": f"{first_name} {last_name}",
            "country": "US",
            "companyName": values_by_type["company_name"],
            "address1": values_by_type["address1"],
            "phone": values_by_type["phone"],
            "city": values_by_type["city"],
            "state": values_by_type["state"],
            "gender": values_by_type["gender"],
            "tags": ["Customer"],
            "locationId": location_id,
        }

        custom_fields = []
        existing_fields = self.list_custom_fields(access_token, location_id)

        for field in data_map:
            t = field["type"]
            target_key = field["value"]

            if field["is_constant"] is True:
                value = field["value"]
                field_name = t
            else:
                value = values_by_type.get(
                    t, getattr(five_x_five_user, t, None)
                )
                field_name = target_key

            if isinstance(value, datetime):
                value = value.strftime("%Y-%m-%dT%H:%M:%SZ")

            if not value:
                continue

            if field_name not in existing_fields:
                try:
                    resp = self.create_custom_field(
                        access_token=access_token,
                        location_id=location_id,
                        key=field_name,
                    )
                    existing_fields[field_name] = resp.get("customField")
                except Exception as e:
                    logging.error(
                        f"Failed to create custom field '{field_name}', {e}"
                    )
                    continue

            custom_fields.append(
                {
                    "id": existing_fields[field_name]["id"],
                    "field_value": value,
                }
            )

        if custom_fields:
            profile["customFields"] = custom_fields

        return {k: v for k, v in profile.items() if v not in (None, "")}

    def __mapped_member_into_list(
        self,
        enrichment_user: EnrichmentUser,
        target_schema: str,
        validations: dict,
        data_map: list,
        location_id: str,
    ):
        enrichment_contacts = enrichment_user.contacts
        if not enrichment_contacts:
            return None

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
            return None

        profile = {
            "email": main_email,
            "firstName": first_name,
            "lastName": last_name,
            "name": f"{first_name} {last_name}",
            "phone": main_phone,
            "country": "US",
            "tags": ["Customer"],
            "source": "Allsource api",
            "locationId": location_id,
        }

        required_types = {m["type"] for m in data_map}
        context = {
            "main_phone": main_phone if main_phone else None,
            "professional_profiles": enrichment_user.professional_profiles,
            "postal": enrichment_user.postal,
            "personal_profiles": enrichment_user.personal_profiles,
            "business_email": business_email if business_email else None,
            "personal_email": personal_email if personal_email else None,
            "country_code": enrichment_user.postal,
            "gender": enrichment_user.personal_profiles,
            "zip_code": enrichment_user.personal_profiles,
            "state": enrichment_user.postal,
            "city": enrichment_user.postal,
            "company": enrichment_user.professional_profiles,
            "linkedin_url": enrichment_contacts,
        }
        result_map = {}
        for field_type in required_types:
            filler = FIELD_FILLERS.get(field_type)
            if filler:
                filler(result_map, context)
        address_data = {}

        for key, value in result_map.items():
            if key in ["city", "state", "zip_code", "addr1", "address"]:
                address_data[key] = value
            elif key == "company":
                profile["companyName"] = value

        if any(
            k in address_data for k in ["addr1", "city", "state", "zip_code"]
        ):
            profile["address1"] = address_data.get("addr1")
            profile["city"] = address_data.get("city")
            profile["state"] = address_data.get("state")

        cleaned = {k: v for k, v in profile.items() if v not in (None, "")}

        return cleaned
