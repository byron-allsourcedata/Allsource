import hashlib
import logging
import os
from typing import List

from fastapi import HTTPException, Depends
from starlette import status
from typing_extensions import Annotated

from dependencies import get_domain_service, get_integration_service
from enums import DomainStatus
from persistence.domains import UserDomainsPersistence
from persistence.leads_persistence import LeadsPersistence
from resolver import injectable
from schemas.pixel_management import ManagementResult
from services.domains import UserDomainsService
from services.integrations.base import IntegrationService

logger = logging.getLogger(__name__)


@injectable
class PixelManagementService:
    def __init__(
        self,
        user_domains_service: Annotated[UserDomainsService, Depends(get_domain_service)],
        integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
        lead_persistence: LeadsPersistence,
        user_domain_persistence: UserDomainsPersistence,
    ):
        self.user_domains_service = user_domains_service
        self.domain_persistence = user_domain_persistence
        self.integration_service = integration_service
        self.leads_persistence = lead_persistence

    def get_pixel_management_data(self, user_id) -> List[ManagementResult]:
        result = []

        contacts_resolving_ids = self.domain_persistence.get_domains_with_contacts_resolving(
            user_id)

        domains = self.user_domains_service.get_domains(user_id=user_id)
        for domain in domains:
            syncs = self.integration_service.get_sync_domain(domain["id"])

            result.append(
                {
                    "id": domain["id"],
                    "domain_name": domain["domain"],
                    "pixel_status": domain["is_pixel_installed"],
                    "contacts_resolving": domain["id"] in contacts_resolving_ids,
                    "additional_pixel": [
                        {
                            "is_add_to_cart_installed": domain["is_add_to_cart_installed"],
                            "is_converted_sales_installed": domain["is_converted_sales_installed"],
                        }
                    ],
                    "resolutions": [
                        {"date": d, "lead_count": c}
                        for d, c in self.leads_persistence.get_leads_count_by_day(domain_id=domain["id"])
                    ],
                    "data_syncs_count": len(syncs),
                }
            )

        return result

    def get_pixel_script(self, action: str, domain_id: int):
        domain = self.user_domains_service.get_domain_by_id(domain_id=domain_id)
        if not domain:
            return {"status": DomainStatus.DOMAIN_NOT_FOUND}

        client_id = domain.data_provider_id
        if client_id is None:
            client_id = hashlib.sha256(
                (str(domain.id) + os.getenv("SECRET_SALT", "")).encode()
            ).hexdigest()
            self.user_domains_service.update_data_provider_id(
                domain_id=domain_id, data_provider_id=client_id
            )

        base_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..")
        )
        script_path = os.path.join(
            base_path, "data", "additional_pixels", f"{action}.js"
        )
        if not os.path.isfile(script_path):
            return {"status": "script_not_found"}

        with open(script_path, "r", encoding="utf-8") as f:
            script_template = f.read()

        script = script_template.replace("{{client_id}}", client_id)

        return script
