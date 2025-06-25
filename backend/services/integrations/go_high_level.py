import logging
import os
from typing import Tuple, Annotated

import httpx
from fastapi import HTTPException, Depends
from gohighlevel import GoHighLevel
from gohighlevel.classes.auth.credentials import Credentials

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
    IntegrationsPresistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from resolver import injectable
from schemas.integrations.google_ads import GoogleAdsProfile
from schemas.integrations.integrations import *
from services.integrations.commonIntegration import resolve_main_email_and_phone
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from utils import (
    validate_and_format_phone,
    get_valid_email,
    get_valid_phone,
    get_valid_location,
    format_phone_number,
    get_http_client,
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

    def get_credentials(self, domain_id: int, user_id: int):
        credential = self.integrations_persistence.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.GOOGLE_ADS.value,
        )
        return credential

    def get_smart_credentials(self, user_id: int):
        credential = (
            self.integrations_persistence.get_smart_credentials_for_service(
                user_id=user_id,
                service_name=SourcePlatformEnum.GOOGLE_ADS.value,
            )
        )
        return credential

    def __save_integrations(
        self, access_token: str, domain_id: int, user: dict
    ):
        credential = self.get_credentials(domain_id, user.get("id"))
        if credential:
            credential.access_token = access_token
            credential.is_failed = False
            credential.error_message = None
            self.integrations_persistence.db.commit()
            return credential

        common_integration = os.getenv("COMMON_INTEGRATION") == "True"
        integration_data = {
            "access_token": access_token,
            "full_name": user.get("full_name"),
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
    ):
        credentials = self.get_credentials(domain_id, user_id)
        sync = self.sync_persistence.edit_sync(
            {
                "integration_id": credentials.id,
                "leads_type": leads_type,
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
        creds = Credentials(
            client_id=getenv("CLIENT_GO_HIGH_LEVEL_ID"),
            client_secret=getenv("CLIENT_GO_HIGH_LEVEL_SECRET"),
        )
        ghl = GoHighLevel(credentials=creds)
        tokens = ghl.exchange_code(
            code=credentials.go_high_level.code,
            redirect_uri=f"{os.getenv('SITE_HOST_URL')}/high-landing",
        )
        print(tokens)
        if not tokens:
            raise HTTPException(
                status_code=400, detail="Failed to get access token"
            )

        integrations = self.__save_integrations(tokens, domain.id, user)
        return {
            "integrations": integrations,
            "status": IntegrationsStatus.SUCCESS.value,
        }

    async def create_sync(
        self,
        domain_id: int,
        customer_id: str,
        leads_type: str,
        list_id: str,
        list_name: str,
        created_by: str,
        user: dict,
        data_map: List[DataMap] = [],
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
                "sync_type": DataSyncType.CONTACT.value,
                "leads_type": leads_type,
                "data_map": data_map,
                "domain_id": domain_id,
                "created_by": created_by,
                "customer_id": customer_id,
            }
        )
        return sync

    def create_smart_audience_sync(
        self,
        customer_id: str,
        smart_audience_id: UUID,
        sent_contacts: int,
        list_id: str,
        list_name: str,
        created_by: str,
        user: dict,
        data_map: List[DataMap] = [],
    ):
        credentials = self.get_smart_credentials(user_id=user.get("id"))

        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credentials.id,
                "list_id": list_id,
                "list_name": list_name,
                "data_map": data_map,
                "sent_contacts": sent_contacts,
                "sync_type": DataSyncType.AUDIENCE.value,
                "smart_audience_id": smart_audience_id,
                "created_by": created_by,
                "customer_id": customer_id,
            }
        )
        return sync

    async def process_data_sync(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        enrichment_users: List[EnrichmentUser],
        target_schema: str,
        validations: dict = {},
    ):
        profiles = []
        for enrichment_user in enrichment_users:
            result = self.__mapped_googleads_profile(
                enrichment_user, target_schema, validations
            )
            if result:
                profiles.append(result)
        if not profiles:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        list_response = self.__add_profile_to_list(
            access_token=user_integration.access_token,
            customer_id=integration_data_sync.customer_id,
            user_list_id=integration_data_sync.list_id,
            profiles=profiles,
        )

        if list_response == ProccessDataSyncResult.TOO_MANY_REQUESTS.value:
            return self.__add_profile_to_list(
                access_token=user_integration.access_token,
                customer_id=integration_data_sync.customer_id,
                user_list_id=integration_data_sync.list_id,
                profiles=profiles,
            )

        return list_response

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: List[Tuple[LeadUser, FiveXFiveUser]],
    ):
        profiles = []
        results = []
        for lead_user, five_x_five_user in user_data:
            profile = self.__mapped_googleads_profile_lead(five_x_five_user)
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

        list_response = self.__add_profile_to_list(
            access_token=user_integration.access_token,
            customer_id=integration_data_sync.customer_id,
            user_list_id=integration_data_sync.list_id,
            profiles=profiles,
        )

        if list_response == ProccessDataSyncResult.TOO_MANY_REQUESTS.value:
            return self.__add_profile_to_list(
                access_token=user_integration.access_token,
                customer_id=integration_data_sync.customer_id,
                user_list_id=integration_data_sync.list_id,
                profiles=profiles,
            )

        if list_response != ProccessDataSyncResult.SUCCESS.value:
            for result in results:
                if result["status"] == ProccessDataSyncResult.SUCCESS.value:
                    result["status"] = list_response
        return results

    def __mapped_googleads_profile_lead(
        self, five_x_five_user: FiveXFiveUser
    ) -> GoogleAdsProfile | None:
        first_email = get_valid_email(
            five_x_five_user, self.million_verifier_integrations
        )

        if first_email in (
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
        ):
            return first_email

        first_phone = get_valid_phone(five_x_five_user)

        address_parts = get_valid_location(five_x_five_user)

        return GoogleAdsProfile(
            email=first_email,
            first_name=getattr(five_x_five_user, "first_name", None),
            last_name=getattr(five_x_five_user, "last_name", None),
            phone=validate_and_format_phone(format_phone_number(first_phone)),
            city=address_parts[1],
            state=address_parts[2],
            address=address_parts[0],
        )

    def __mapped_googleads_profile(
        self,
        enrichment_user: EnrichmentUser,
        target_schema: str,
        validations: dict,
    ) -> GoogleAdsProfile:
        enrichment_contacts = enrichment_user.contacts
        if not enrichment_contacts:
            return None

        business_email, personal_email, phone = (
            self.sync_persistence.get_verified_email_and_phone(
                enrichment_user.id
            )
        )
        main_email, main_phone = resolve_main_email_and_phone(
            enrichment_contacts,
            validations,
            target_schema,
            business_email,
            personal_email,
            phone,
        )
        first_name = enrichment_contacts.first_name
        last_name = enrichment_contacts.last_name

        if not main_email or not first_name or not last_name:
            return None

        enrichment_user_postal = enrichment_user.postal
        city = None
        state = None
        country_code = None
        if enrichment_user_postal:
            city = enrichment_user_postal.home_city
            if not city:
                city = enrichment_user_postal.business_city
            state = enrichment_user_postal.home_state
            if not state:
                state = enrichment_user_postal.business_state

            country_code = enrichment_user_postal.home_country
            if not country_code:
                country_code = enrichment_user_postal.business_country

        return GoogleAdsProfile(
            email=main_email,
            first_name=first_name,
            last_name=last_name,
            phone=main_phone,
            city=city,
            state=state,
            country_code=country_code,
        )
