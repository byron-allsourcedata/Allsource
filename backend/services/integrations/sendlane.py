from models import UserIntegration, IntegrationUserSync, LeadUser
from resolver import injectable
from utils import (
    validate_and_format_phone,
    get_http_client,
    get_valid_email,
    get_valid_email_without_million,
    get_valid_phone,
    get_valid_location,
)
from typing import List, Tuple, Annotated
from fastapi import HTTPException, Depends
import httpx
import os
from datetime import datetime, timedelta
from utils import format_phone_number
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
from models.five_x_five_users import FiveXFiveUser
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from schemas.integrations.sendlane import SendlaneContact, SendlaneSender
from schemas.integrations.integrations import (
    DataMap,
    IntegrationCredentials,
    ListFromIntegration,
)
from persistence.domains import UserDomainsPersistence
from utils import extract_first_email
from persistence.integrations.integrations_persistence import (
    IntegrationsPresistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence


@injectable
class SendlaneIntegrationService:
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
        self.million_verifier_integrations = million_verifier_integrations
        self.sync_persistence = sync_persistence
        self.client = client

    def get_credentials(self, domain_id: int, user_id: int):
        return self.integrations_persisntece.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.SENDLANE.value,
        )

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
        if not headers:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "accept": "application/json",
                "content-type": "application/json",
            }
        url = f"https://api.sendlane.com/v2" + url
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
            "service_name": SourcePlatformEnum.SENDLANE.value,
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

        return IntegrationsStatus.SUCCESS

    def edit_sync(
        self,
        leads_type: str,
        list_id: str,
        list_name: str,
        integrations_users_sync_id: int,
        domain_id: int,
        created_by: str,
        user_id: int,
    ):
        credentials = self.get_credentials(domain_id, user_id)
        sync = self.sync_persistence.edit_sync(
            {
                "integration_id": credentials.id,
                "list_id": list_id,
                "list_name": list_name,
                "domain_id": domain_id,
                "leads_type": leads_type,
                "created_by": created_by,
            },
            integrations_users_sync_id,
        )

        return sync

    def __get_list(self, api_key):
        response = self.__handle_request(url="/lists", api_key=api_key)
        return response

    def get_list(self, domain_id: int, user_id: int):
        credential = self.get_credentials(domain_id, user_id)
        if not credential:
            return
        lists = self.__get_list(credential.access_token)
        if lists.status_code == 401:
            credential.is_failed = True
            credential.error_message = "Invalid API Key"
            self.integrations_persisntece.db.commit()
            return {"status": IntegrationsStatus.CREDENTAILS_INVALID.value}
        return [self.__mapped_list(list) for list in lists.json().get("data")]

    def add_integration(
        self, credentials: IntegrationCredentials, domain, user: dict
    ):
        domain_id = None if domain is None else domain.id
        lists = self.__get_list(credentials.sendlane.api_key)
        if lists.status_code == 401:
            raise HTTPException(
                status_code=400,
                detail={"status": IntegrationsStatus.CREDENTAILS_INVALID.value},
            )
        return self.__save_integrations(
            credentials.sendlane.api_key,
            domain_id=domain_id,
            user=user,
        )

    def __get_sender(self, api_key):
        response = self.__handle_request("/senders", api_key=api_key)
        return response

    def get_sender(self, domain_id: int, user_id: int):
        credential = self.get_credentials(domain_id, user_id)
        if not credential:
            return
        senders = self.__get_sender(credential.access_token)
        if senders.status_code == 401:
            credential.is_failed = True
            credential.error_message = "Invalid API Key"
            self.integrations_persisntece.db.commit()
            return
        return [
            self.__mapped_sender(sender)
            for sender in senders.json().get("data")
        ]

    def create_list(self, list, domain_id: int, user_id: int):
        credential = self.get_credentials(domain_id, user_id)
        if not credential:
            raise HTTPException(
                status_code=403,
                detail={"status": IntegrationsStatus.CREDENTIALS_NOT_FOUND},
            )
        json = {"name": list.name, "sender_id": list.sender_id}
        response = self.__handle_request(
            "/lists", method="POST", api_key=credential.access_token, json=json
        )
        if response == 401:
            credential.is_failed = True
            credential.error_message = "Invalid API Key"
            self.integrations_persisntece.db.commit()
            return
        if response.status_code == 422:
            raise HTTPException(
                status_code=422,
                detail={"status": response.json().get("message")},
            )
        return self.__mapped_list(response.json().get("data"))

    async def create_sync(
        self,
        leads_type: str,
        list_id: str,
        list_name: str,
        data_map: List[DataMap],
        domain_id: int,
        created_by: str,
        user: dict,
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
                "leads_type": leads_type,
                "data_map": data_map,
                "created_by": created_by,
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
        profiles = []
        results = []
        for lead_user, five_x_five_user in user_data:
            profile = await self.__mapped_profile(
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

        result_bulk = self.bulk_add_contacts(
            access_token=user_integration.access_token,
            profiles=profiles,
            list_id=integration_data_sync.list_id,
        )
        if result_bulk != ProccessDataSyncResult.SUCCESS.value:
            for result in results:
                if result["status"] == ProccessDataSyncResult.SUCCESS.value:
                    result["status"] = result_bulk
        return results

    async def __mapped_profile(
        self,
        lead: FiveXFiveUser,
        data_map: list,
        is_email_validation_enabled: bool,
    ) -> str | dict[str, str]:
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

        profile = {
            "email": first_email,
            "phone": validate_and_format_phone(first_phone),
            "first_name": getattr(lead, "first_name", None),
            "last_name": getattr(lead, "last_name", None),
        }

        cleaned = {k: v for k, v in profile.items() if v not in (None, "")}
        return cleaned

    def bulk_add_contacts(
        self,
        profiles: List[dict],
        access_token: str,
        list_id: int,
    ) -> ProccessDataSyncResult:
        data = {"contacts": profiles}
        response = self.__handle_request(
            f"/lists/{list_id}/contacts",
            api_key=access_token,
            json=data,
            method="POST",
        )
        if response.status_code in (200, 201, 202):
            return ProccessDataSyncResult.SUCCESS.value

        if response.status_code == 401:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value

        return ProccessDataSyncResult.PLATFORM_VALIDATION_FAILED.value

    async def __create_contact(
        self, five_x_five_user, access_token, list_id: int
    ):
        profile = await self.__mapped_sendlane_contact(five_x_five_user)
        if profile in (
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
        ):
            return profile

        json = {"contacts": [{**profile.model_dump()}]}
        response = self.__handle_request(
            f"/lists/{list_id}/contacts",
            api_key=access_token,
            json=json,
            method="POST",
        )
        if response.status_code == 401:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        if response.status_code == 202:
            return response

    def __mapped_list(self, list):
        return ListFromIntegration(
            id=str(list.get("id")), list_name=list.get("name")
        )

    def __mapped_sender(self, sender):
        return SendlaneSender(
            id=str(sender.get("id")), sender_name=sender.get("from_name")
        )

    async def __mapped_sendlane_contact(self, five_x_five_user: FiveXFiveUser):
        first_email = await get_valid_email(five_x_five_user)

        if first_email in (
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
        ):
            return first_email

        first_phone = get_valid_phone(five_x_five_user)

        if first_email:
            first_email = first_email.split(",")[-1].strip()
        first_phone = format_phone_number(first_phone)
        phone_number = validate_and_format_phone(first_phone)
        return SendlaneContact(
            email=first_email,
            first_name=five_x_five_user.first_name or None,
            last_name=five_x_five_user.last_name or None,
            phone=phone_number.split(", ")[-1] if phone_number else None,
        )
