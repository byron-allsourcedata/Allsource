from datetime import datetime
from typing import List, Tuple, Annotated

from fastapi import HTTPException, Depends
import httpx

from enums import (
    IntegrationsStatus,
    SourcePlatformEnum,
    ProccessDataSyncResult,
    DataSyncType,
)
from models import UserIntegration, LeadUser
from models.five_x_five_users import FiveXFiveUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from persistence.domains import UserDomainsPersistence
from persistence.integrations.integrations_persistence import (
    IntegrationsPresistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
from resolver import injectable
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from utils import (
    format_phone_number,
    get_valid_email,
    get_http_client,
    get_valid_email_without_million,
)


@injectable
class ZapierIntegrationService:
    def __init__(
        self,
        lead_persistence: LeadsPersistence,
        domain_persistence: UserDomainsPersistence,
        sync_persistence: IntegrationsUserSyncPersistence,
        integration_persistence: IntegrationsPresistence,
        client: Annotated[httpx.Client, Depends(get_http_client)],
        million_verifier_integrations: MillionVerifierIntegrationsService,
    ):
        self.leads_persistence = lead_persistence
        self.domain_persistence = domain_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.integration_persistence = integration_persistence
        self.client = client

    def get_credentials(self, domain_id, user_id=None):
        return self.integration_persistence.get_credentials_for_service(
            domain_id=domain_id,
            user_id=user_id,
            service_name=SourcePlatformEnum.ZAPIER.value,
        )

    def __create_integrations(self, domain):
        integration = {
            "domain_id": domain.id,
            "service_name": SourcePlatformEnum.ZAPIER.value,
        }
        self.integration_persistence.create_integration(integration)
        return integration

    def add_integrations(self, domain):
        domain_id = None if domain is None else domain.id
        credentials = self.get_credentials(domain_id)
        if credentials:
            return
        new_integrations = self.__create_integrations(domain=domain)
        if not new_integrations:
            raise HTTPException(
                status_code=400,
                detail={"status": IntegrationsStatus.CREATE_IS_FAILED.value},
            )

        return new_integrations

    async def create_data_sync(
        self, domain_id, leads_type, hook_url, list_name, created_by
    ):
        credentials = self.get_credentials(domain_id)
        leads_type = self.__mapped_leads_type(leads_type)
        sync = self.sync_persistence.create_sync(
            {
                "domain_id": domain_id,
                "list_name": list_name,
                "leads_type": leads_type,
                "sent_contacts": -1,
                "sync_type": DataSyncType.CONTACT.value,
                "created_by": created_by,
                "integration_id": credentials.id,
                "hook_url": hook_url,
            }
        )

        return sync

    def delete_data_sync(self, domain_id):
        sync = self.sync_persistence.get_data_sync_filter_by(
            domain_id=domain_id
        )
        if not sync:
            return
        self.sync_persistence.delete_sync(
            domain_id=domain_id, list_id=sync[0].id
        )
        return

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: List[Tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
    ):
        results = []
        for lead_user, five_x_five_user in user_data:
            data = self.__mapped_lead(
                five_x_five_user, is_email_validation_enabled
            )
            if data in (
                ProccessDataSyncResult.INCORRECT_FORMAT.value,
                ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
            ):
                results.append({"lead_id": lead_user.id, "status": data})
                continue
            else:
                results.append(
                    {
                        "lead_id": lead_user.id,
                        "status": ProccessDataSyncResult.SUCCESS.value,
                    }
                )

            profile = self.__create_profile(data, integration_data_sync)
            if profile == ProccessDataSyncResult.AUTHENTICATION_FAILED.value:
                for result in results:
                    result["status"] = (
                        ProccessDataSyncResult.AUTHENTICATION_FAILED.value
                    )
                return results

        return results

    def __create_profile(self, data: dict, sync: IntegrationUserSync):
        response = self.client.post(url=sync.hook_url, json=data)
        if response.status_code == 401:
            return ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        return ProccessDataSyncResult.SUCCESS.value

    def __mapped_leads_type(self, lead_type):
        if lead_type:
            lead_type = lead_type.lower()
        if lead_type == "visitors":
            return "visitor"
        if lead_type == "Abandoned Cart":
            return "abandoned_cart"
        if lead_type == "viewed product":
            return "viewed_product"
        if lead_type == "converted sales":
            return "converted_sales"
        if lead_type == "all contacts":
            return "allContacts"
        return "allContacts"

    def __mapped_lead(
        self, five_x_five_user: FiveXFiveUser, is_email_validation_enabled: bool
    ):
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

        time_on_site, url_visited = self.leads_persistence.get_visit_stats(
            five_x_five_user.id
        )
        lead_dict = {
            "id": five_x_five_user.id,
            "first_name": five_x_five_user.first_name,
            "last_name": five_x_five_user.last_name,
            "mobile_phone": format_phone_number(five_x_five_user.mobile_phone),
            "direct_number": five_x_five_user.direct_number,
            "gender": five_x_five_user.gender.lower()
            if five_x_five_user.gender
            else None,
            "personal_zip": five_x_five_user.personal_zip or "N/A",
            "personal_phone": format_phone_number(
                five_x_five_user.personal_phone
            ),
            "personal_emails": first_email,
            "personal_city": five_x_five_user.personal_city or "N/A",
            "personal_state": five_x_five_user.personal_state or "N/A",
            "company_name": five_x_five_user.company_name or "N/A",
            "company_domain": five_x_five_user.company_domain or "N/A",
            "job_title": five_x_five_user.job_title or "N/A",
            "last_updated": five_x_five_user.last_updated.isoformat()
            if isinstance(five_x_five_user.last_updated, datetime)
            else None,
            "age_min": five_x_five_user.age_min,
            "age_max": five_x_five_user.age_max,
            "personal_address": five_x_five_user.personal_address or "N/A",
            "married": five_x_five_user.married,
            "homeowner": five_x_five_user.homeowner,
            "dpv_code": five_x_five_user.dpv_code,
            "children": five_x_five_user.children,
            "income_range": five_x_five_user.income_range,
            "time_on_site": time_on_site,
            "url_visited": url_visited,
        }

        return {k: v for k, v in lead_dict.items() if v is not None}
