import logging
import os
from datetime import datetime
from typing import Tuple, Annotated

import httpx
from fastapi import HTTPException, Depends

from config.util import getenv
from db_dependencies import Db
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
    IntegrationsPresistence,
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
            domain_persistence: UserDomainsPersistence,
            integrations_persistence: IntegrationsPresistence,
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
            self, integration_id: int, refresh_token: str
    ) -> str:
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": os.getenv("CLIENT_GO_HIGH_LEVEL_ID"),
            "client_secret": os.getenv("CLIENT_GO_HIGH_LEVEL_SECRET"),
        }

        response = self.__handle_request(
            method="POST", url=self.TOKEN_URL, data=data, headers=headers
        )

        tokens = response.json()
        if not tokens.get("refresh_token"):
            raise HTTPException(
                status_code=409,
                detail={"status": IntegrationsStatus.CREDENTAILS_INVALID.value, "response": tokens},
            )
        self.integrations_persistence.update_refresh_token(
            integration_id=integration_id, refresh_token=tokens["refresh_token"]
        )
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

        integartion = self.integrations_persistence.create_integration(
            integration_data
        )

        if not integartion:
            raise HTTPException(
                status_code=409,
                detail={"status": IntegrationsStatus.CREATE_IS_FAILED.value},
            )

        return integartion

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
            raise HTTPException(
                status_code=409,
                detail={"status": IntegrationsStatus.CREDENTAILS_INVALID.value},
            )
        result = response.json()

        existing_fields = {f["name"]: f for f in result["customFields"]}

        return existing_fields

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
                status_code=409,
                detail={"status": IntegrationsStatus.CREDENTAILS_INVALID.value},
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
        access_token = self.refresh_ghl_token(
            integration_id=user_integration.id,
            refresh_token=user_integration.access_token,
        )

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

        return result

    async def process_data_sync_lead(
            self,
            user_integration: UserIntegration,
            integration_data_sync: IntegrationUserSync,
            user_data: list[Tuple[LeadUser, FiveXFiveUser]],
            is_email_validation_enabled: bool,
    ):
        results = []
        access_token = self.refresh_ghl_token(
            integration_id=user_integration.id,
            refresh_token=user_integration.access_token,
        )
        for lead_user, five_x_five_user in user_data:
            contact_data = await self.__mapped_profile_lead(
                five_x_five_user=five_x_five_user,
                data_map=integration_data_sync.data_map,
                location_id=user_integration.location_id,
                access_token=access_token,
                is_email_validation_enabled=is_email_validation_enabled,
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
    ) -> dict | str:
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

        first_phone = get_valid_phone(five_x_five_user)
        address_parts = get_valid_location(five_x_five_user)

        profile = {
            "email": first_email,
            "firstName": first_name,
            "lastName": last_name,
            "name": f"{first_name} {last_name}",
            "country": "US",
            "companyName": getattr(five_x_five_user, "company_name", None),
            "address1": address_parts[0],
            "phone": validate_and_format_phone(first_phone),
            "city": address_parts[1],
            "state": address_parts[2],
            "gender": getattr(five_x_five_user, "gender", None),
            "tags": ["Customer"],
            "locationId": location_id,
        }
        custom_fields = []
        existing_fields = self.list_custom_fields(access_token, location_id)

        for field in data_map:
            t = field["type"]
            key = field["value"]
            is_constant = field["is_constant"]

            if is_constant is True:
                field_name = t
                val = key
            else:
                field_name = key
                val = getattr(five_x_five_user, t, None)

                if isinstance(val, datetime):
                    val = val.strftime("%Y-%m-%dT%H:%M:%SZ")

            if val is None:
                continue

            if field_name not in existing_fields:
                try:
                    resp = self.create_custom_field(
                        access_token=access_token,
                        location_id=location_id,
                        key=field_name,
                    )

                    item = resp.get("customField")
                    if item:
                        existing_fields[field_name] = item
                    else:
                        logging.error(f"Failed to create custom field: '{field_name}', Response: {resp}")
                except Exception as e:
                    logging.error(f"Failed to create custom field '{field_name}', Exception: {e}")

            field_info = existing_fields.get(field_name)
            if not field_info:
                logging.error(f"Skipping unknown custom field: {field_name}")
                continue

            field_key = field_info["id"]
            custom_fields.append({"id": field_key, "field_value": val})

        if custom_fields:
            profile["customFields"] = custom_fields

        cleaned = {k: v for k, v in profile.items() if v not in (None, "")}
        return cleaned

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
            "main_phone": main_phone,
            "professional_profiles": enrichment_user.professional_profiles,
            "postal": enrichment_user.postal,
            "personal_profiles": enrichment_user.personal_profiles,
            "business_email": business_email,
            "personal_email": personal_email,
            "country_code": enrichment_user.postal,
            "gender": enrichment_user.personal_profiles,
            "zip_code": enrichment_user.personal_profiles,
            "state": enrichment_user.postal,
            "city": enrichment_user.postal,
            "company": enrichment_user.professional_profiles,
            "business_email_last_seen_date": enrichment_contacts,
            "personal_email_last_seen": enrichment_contacts,
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


def get_current_refresh_token(integration_id: int, db: Db) -> str | None:
    integration = db.query(UserIntegration).filter(UserIntegration.id == integration_id).first()
    if integration:
        return integration.access_token
    return None


async def main():
    from resolver import Resolver

    resolver = Resolver()

    service: GoHighLevelIntegrationsService = await resolver.resolve(GoHighLevelIntegrationsService)
    db = await resolver.resolve(Db)

    domain_integration_id = 845
    location_id = "MvrMrwrGB9OXtuC4zotC"

    # Need to use not constant, but method to get current refresh_token
    refresh_token = get_current_refresh_token(domain_integration_id, db)
    # print(f"{refresh_token=}")
    access_token = service.refresh_ghl_token(domain_integration_id, refresh_token)
    # print(f"{access_token=}")
    refresh_token = get_current_refresh_token(domain_integration_id, db)
    # print(f"{refresh_token=}")

    response = service.create_custom_field(
        access_token=access_token,
        location_id=location_id,
        key="Another field yo"
    )

    print(response)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
