import hashlib
import json
import logging
import os
from datetime import datetime
from typing import Tuple

import mailchimp_marketing as MailchimpMarketing
from fastapi import HTTPException
from mailchimp_marketing.api_client import ApiClientError

from enums import (
    IntegrationsStatus,
    SourcePlatformEnum,
    ProccessDataSyncResult,
    DataSyncType,
    IntegrationLimit,
)
from models import LeadUser
from models.enrichment.enrichment_users import EnrichmentUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import (
    IntegrationsPresistence,
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


@injectable
class MailchimpIntegrationsService:
    def __init__(
        self,
        domain_persistence: UserDomainsPersistence,
        integrations_persistence: IntegrationsPresistence,
        leads_persistence: LeadsPersistence,
        sync_persistence: IntegrationsUserSyncPersistence,
        million_verifier_integrations: MillionVerifierIntegrationsService,
    ):
        self.domain_persistence = domain_persistence
        self.integrations_persisntece = integrations_persistence
        self.leads_persistence = leads_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.client = MailchimpMarketing.Client()

    def get_credentials(self, domain_id: int, user_id: int):
        return self.integrations_persisntece.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.MAILCHIMP.value,
        )

    def get_smart_credentials(self, user_id: int):
        return self.integrations_persisntece.get_smart_credentials_for_service(
            user_id=user_id, service_name=SourcePlatformEnum.MAILCHIMP.value
        )

    def create_list(self, list_data, domain_id: int, user_id: int):
        credential = self.get_credentials(domain_id, user_id)
        response = None
        self.client.set_config(
            {
                "api_key": credential.access_token,
                "server": credential.data_center,
            }
        )
        list_info = {
            "name": list_data.name,
            "permission_reminder": "You are receiving this email because you signed up for updates.",
            "email_type_option": True,
            "contact": {
                "company": "Default Company",
                "address1": "123 Default St.",
                "city": "Default City",
                "state": "Default State",
                "zip": "00000",
                "country": "US",
            },
            "campaign_defaults": {
                "from_name": "Allsource",
                "from_email": "noreply@allsourcedata.io",
                "subject": "Welcome to Our Updates",
                "language": "en",
            },
        }
        custom_fields = [
            {"name": "Gender", "tag": "GENDER", "type": "text"},
            {"name": "Company Domain", "tag": "COMPANY_DOMAIN", "type": "text"},
            {"name": "Company SIC", "tag": "COMPANY_SIC", "type": "text"},
            {
                "name": "Company LinkedIn URL",
                "tag": "COMPANY_LI_URL",
                "type": "text",
            },
            {"name": "Company Revenue", "tag": "COMPANY_REV", "type": "text"},
            {
                "name": "Company Employee Count",
                "tag": "COMPANY_EMP",
                "type": "text",
            },
            {"name": "Net Worth", "tag": "NET_WORTH", "type": "text"},
            {"name": "Last Updated", "tag": "LAST_UPDATED", "type": "text"},
            {
                "name": "Personal Emails Last Seen",
                "tag": "PE_LAST_SEEN",
                "type": "text",
            },
            {
                "name": "Company Last Updated",
                "tag": "COMPANY_LAST_UPD",
                "type": "text",
            },
            {
                "name": "Job Title Last Updated",
                "tag": "JOB_TITLE_LAST",
                "type": "text",
            },
            {"name": "Age Min", "tag": "AGE_MIN", "type": "text"},
            {"name": "Age Max", "tag": "AGE_MAX", "type": "text"},
            {
                "name": "Additional Personal Emails",
                "tag": "ADD_PERSONAL_EMAILS",
                "type": "text",
            },
            {"name": "LinkedIn URL", "tag": "LINKEDIN_URL", "type": "text"},
            {"name": "Married", "tag": "MARRIED", "type": "text"},
            {"name": "Children", "tag": "CHILDREN", "type": "text"},
            {"name": "Income Range", "tag": "INCOME_RANGE", "type": "text"},
            {"name": "Homeowner", "tag": "HOMEOWNER", "type": "text"},
            {"name": "Seniority Level", "tag": "SENIORITY", "type": "text"},
            {"name": "Department", "tag": "DEPARTMENT", "type": "text"},
            {
                "name": "Primary Industry",
                "tag": "PRIMARY_INDUSTRY",
                "type": "text",
            },
            {"name": "Work History", "tag": "WORK_HISTORY", "type": "text"},
            {
                "name": "Education History",
                "tag": "EDUCATION_HISTORY",
                "type": "text",
            },
            {
                "name": "Company Description",
                "tag": "COMPANY_DESC",
                "type": "text",
            },
            {
                "name": "Related Domains",
                "tag": "RELATED_DOMAINS",
                "type": "text",
            },
            {
                "name": "Social Connections",
                "tag": "SOCIAL_CONN",
                "type": "text",
            },
            {"name": "DPV Code", "tag": "DPV_CODE", "type": "text"},
            {"name": "TIME ON SITE", "tag": "TIME_ON_SITE", "type": "text"},
            {"name": "URL VISITED", "tag": "URL_VISITED", "type": "text"},
        ]
        try:
            response = self.client.lists.create_list(list_info)
            list_id = response["id"]
            for field in custom_fields:
                self.client.lists.add_list_merge_field(list_id, field)

        except ApiClientError as error:
            if error.status_code == 403:
                return {"status": IntegrationsStatus.CREATE_IS_FAILED.value}
            if error.status_code == 401:
                credential.error_message = "Invalid API Key"
                credential.is_failed = True
                self.integrations_persisntece.db.commit()
                return {"status": IntegrationsStatus.CREDENTAILS_INVALID.value}

        return self.__mapped_list(response) if response else None

    def get_list(
        self,
        user_id: int,
        domain_id: int,
        api_key: str = None,
        server: str = None,
    ):
        if api_key and server:
            self.client.set_config({"api_key": api_key, "server": server})
        else:
            credentials = self.get_credentials(domain_id, user_id)
            if not credentials:
                return
            self.client.set_config(
                {
                    "api_key": credentials.access_token,
                    "server": credentials.data_center,
                }
            )

        try:
            response = self.client.lists.get_all_lists()
            return [self.__mapped_list(list) for list in response.get("lists")]
        except ApiClientError as error:
            if credentials:
                credentials.error_message = json.loads(error.text).get("detail")
                credentials.is_failed = True
                self.integrations_persisntece.db.commit()
                return

    def __save_integation(
        self, domain_id: int, api_key: str, server: str, user: dict
    ):
        credential = self.get_credentials(
            domain_id=domain_id, user_id=user.get("id")
        )
        if credential:
            credential.access_token = api_key
            credential.data_center = server
            credential.is_failed = False
            self.integrations_persisntece.db.commit()
            return credential

        common_integration = os.getenv("COMMON_INTEGRATION") == "True"
        integration_data = {
            "access_token": api_key,
            "data_center": server,
            "full_name": user.get("full_name"),
            "service_name": SourcePlatformEnum.MAILCHIMP.value,
            "limit": IntegrationLimit.MAILCHIMP.value,
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

    def add_integration(
        self, credentials: IntegrationCredentials, domain, user: dict
    ):
        domain_id = domain.id if domain else None
        data_center = credentials.mailchimp.api_key.split("-")[-1]
        try:
            lists = self.get_list(
                api_key=credentials.mailchimp.api_key,
                domain_id=domain_id,
                user_id=user.get("id"),
                server=data_center,
            )
            if not lists:
                raise HTTPException(
                    status_code=200,
                    detail={
                        "status": IntegrationsStatus.CREDENTAILS_INVALID.value
                    },
                )
        except:
            raise HTTPException(
                status_code=200,
                detail={"status": IntegrationsStatus.CREDENTAILS_INVALID.value},
            )
        integration = self.__save_integation(
            domain_id=domain_id,
            api_key=credentials.mailchimp.api_key,
            server=data_center,
            user=user,
        )
        return integration

    async def create_sync(
        self,
        domain_id: int,
        leads_type: str,
        list_id: str,
        list_name: str,
        data_map: List[DataMap],
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

    def create_smart_audience_sync(
        self,
        smart_audience_id: UUID,
        sent_contacts: int,
        list_id: str,
        list_name: str,
        data_map: List[DataMap],
        created_by: str,
        user: dict,
    ):
        credentials = self.get_smart_credentials(user_id=user.get("id"))
        sync = self.sync_persistence.create_sync(
            {
                "integration_id": credentials.id,
                "list_id": list_id,
                "list_name": list_name,
                "sent_contacts": sent_contacts,
                "sync_type": DataSyncType.AUDIENCE.value,
                "smart_audience_id": smart_audience_id,
                "data_map": data_map,
                "created_by": created_by,
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
        results = []
        for enrichment_user in enrichment_users:
            profile = self.__mapped_member_into_list(
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

            if profile:
                profiles.append(profile)

        if not profiles:
            return results

        profile_response = self.__create_profile(
            user_integration, integration_data_sync, profiles
        )

        if profile_response != ProccessDataSyncResult.SUCCESS.value:
            for result in results:
                if result["status"] == ProccessDataSyncResult.SUCCESS.value:
                    result["status"] = profile_response

        return results

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
            profile = await self.__mapped_member_into_list_lead(
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

        profile = self.__create_profile(
            user_integration, integration_data_sync, profiles
        )
        if profile in (
            ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.LIST_NOT_EXISTS.value,
        ):
            for res in results:
                if res["status"] == ProccessDataSyncResult.SUCCESS.value:
                    res["status"] = profile

        return results

    def sync_contacts_bulk(self, list_id: str, profiles_list: List[dict]):
        operations = []
        for profile in profiles_list:
            email = profile["email_address"]
            subscriber_hash = hashlib.md5(email.lower().encode()).hexdigest()

            props = {k: v for k, v in profile.items() if v is not None}
            props["email_address"] = email

            operations.append(
                {
                    "method": "PUT",
                    "path": f"/lists/{list_id}/members/{subscriber_hash}",
                    "operation_id": subscriber_hash,
                    "body": json.dumps(props),
                }
            )

        try:
            batch = self.client.batches.start({"operations": operations})
        except ApiClientError as error:
            logging.error("Batch operation failed: %s", error.text)
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value

        return ProccessDataSyncResult.SUCCESS.value

    def __create_profile(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        profiles: List[dict],
    ):
        self.client.set_config(
            {
                "api_key": user_integration.access_token,
                "server": user_integration.data_center,
            }
        )

        try:
            existing_fields = self.client.lists.get_list_merge_fields(
                integration_data_sync.list_id
            )
            existing_field_names = [
                field["name"] for field in existing_fields["merge_fields"]
            ]
            all_merge_keys = set()
            for profile in profiles:
                merge_fields = profile.get("merge_fields", {})
                all_merge_keys.update(merge_fields.keys())

            for key in all_merge_keys:
                if key not in existing_field_names:
                    self.client.lists.add_list_merge_field(
                        integration_data_sync.list_id,
                        {"name": key, "type": "text", "tag": key.upper()},
                    )

        except ApiClientError as error:
            if error.status_code == 404:
                return ProccessDataSyncResult.LIST_NOT_EXISTS.value

        response = self.sync_contacts_bulk(
            integration_data_sync.list_id, profiles
        )

        return response

    def edit_sync(
        self,
        leads_type: str,
        list_id: str,
        list_name: str,
        integrations_users_sync_id: int,
        data_map: List[DataMap],
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
                "leads_type": leads_type,
                "data_map": data_map,
                "created_by": created_by,
            },
            integrations_users_sync_id,
        )

        return sync

    def __mapped_list(self, list):
        return ListFromIntegration(id=list["id"], list_name=list["name"])

    def __mapped_member_into_list(
        self,
        enrichment_user: EnrichmentUser,
        target_schema: str,
        validations: dict,
        data_map: list,
    ):
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
            "email_address": main_email,
            "status": "subscribed",
            "email_type": "text",
            "merge_fields": {
                "FNAME": first_name,
                "LNAME": last_name,
            },
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
            key_upper = key.upper()

            if key in ["city", "state", "zip_code", "addr1", "address"]:
                address_data[key] = value
            elif key == "country" or key == "country_code":
                result["merge_fields"]["COUNTRY"] = value
            elif key == "company":
                result["merge_fields"]["COMPANY"] = value
            elif key in [
                "business_email_last_seen_date",
                "personal_email_last_seen",
            ]:
                merge_key = key.upper()
                result["merge_fields"][merge_key] = str(value)
            elif key == "linkedin_url":
                result["merge_fields"]["LINKEDIN"] = value
            elif key in ["business_email", "personal_email", "phone"]:
                merge_key = key.upper()
                result["merge_fields"][merge_key] = value
            else:
                result["merge_fields"][key_upper] = value

        if any(
            k in address_data for k in ["addr1", "city", "state", "zip_code"]
        ):
            result["merge_fields"]["ADDRESS"] = {
                "addr1": address_data.get("addr1", "N/A"),
                "city": address_data.get("city", "N/A"),
                "state": address_data.get("state", "N/A"),
                "zip": address_data.get("zip_code", "N/A"),
            }

        return result

    async def __mapped_member_into_list_lead(
        self,
        five_x_five_user: FiveXFiveUser,
        data_map: list,
        is_email_validation_enabled: bool,
    ):
        if is_email_validation_enabled:
            first_email = await get_valid_email(
                five_x_five_user, self.million_verifier_integrations
            )
        else:
            first_email = get_valid_email_without_million(five_x_five_user)

        if first_email in (
            ProccessDataSyncResult.INCORRECT_FORMAT.value,
            ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
        ):
            return first_email

        first_phone = get_valid_phone(five_x_five_user)

        location = {
            "address": getattr(five_x_five_user, "personal_address")
            or getattr(five_x_five_user, "company_address", None),
            "city": getattr(five_x_five_user, "personal_city")
            or getattr(five_x_five_user, "company_city", None),
            "region": getattr(five_x_five_user, "personal_state")
            or getattr(five_x_five_user, "company_state", None),
            "zip": getattr(five_x_five_user, "personal_zip")
            or getattr(five_x_five_user, "company_zip", None),
        }

        time_on_site, url_visited = self.leads_persistence.get_visit_stats(
            five_x_five_user.id
        )

        result = {
            "email_address": first_email,
            "phone_number": format_phone_number(first_phone),
            "first_name": getattr(five_x_five_user, "first_name", None),
            "last_name": getattr(five_x_five_user, "last_name", None),
            "organization": getattr(five_x_five_user, "company_name", None),
            "location": location,
            "job_title": getattr(five_x_five_user, "job_title", None),
            "company_name": getattr(five_x_five_user, "company_name", None),
            "status": "subscribed",
            "email_type": "text",
            "time_on_site": time_on_site,
            "url_visited": url_visited,
            "merge_fields": {
                "FNAME": getattr(five_x_five_user, "first_name", None),
                "LNAME": getattr(five_x_five_user, "last_name", None),
                "PHONE": format_phone_number(first_phone),
                "COMPANY": getattr(five_x_five_user, "company_name", None),
            },
        }
        for field in data_map:
            key = field["type"]
            merge_tag = field["value"].upper().replace(" ", "_")
            value = getattr(five_x_five_user, key, None)
            if value is not None:
                if isinstance(value, datetime):
                    value = value.strftime("%Y-%m-%dT%H:%M:%SZ")
                result["merge_fields"][merge_tag] = value

        def replace_none_with_na(d):
            for k, v in d.items():
                if isinstance(v, dict):
                    replace_none_with_na(v)
                else:
                    if v is None:
                        d[k] = "N/A"

        replace_none_with_na(result)
        return result
