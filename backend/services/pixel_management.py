import hashlib
import logging
import os
from typing import List

from fastapi import HTTPException
from starlette import status

from enums import DomainStatus
from persistence.leads_persistence import LeadsPersistence
from schemas.pixel_management import ManagementResult
from services.domains import UserDomainsService
from services.integrations.base import IntegrationService

logger = logging.getLogger(__name__)


class PixelManagementService:
    def __init__(
        self,
        user_domains_service: UserDomainsService,
        integration_service: IntegrationService,
        lead_persistence: LeadsPersistence,
    ):
        self.user_domains_service = user_domains_service
        self.integration_service = integration_service
        self.leads_persistence = lead_persistence

    def get_pixel_management_data(self, user_id) -> List[ManagementResult]:
        result = []
        domains = self.user_domains_service.get_domains(user_id=user_id)
        for domain in domains:
            syncs = self.integration_service.get_sync_domain(domain["id"])
            filtered_syncs = [
                {
                    "createdDate": sync["createdDate"],
                    "list_name": sync["list_name"],
                    "lastSync": sync["lastSync"],
                    "platform": sync["platform"],
                    "contacts": sync["contacts"],
                    "createdBy": sync["createdBy"],
                    "status": sync["status"],
                    "syncStatus": sync["syncStatus"],
                }
                for sync in syncs
            ]
            result.append(
                {
                    "id": domain["id"],
                    "domain_name": domain["domain"],
                    "pixel_status": domain["is_pixel_installed"],
                    "additional_pixel": [
                        {
                            "is_add_to_cart_installed": domain[
                                "is_add_to_cart_installed"
                            ],
                            "is_converted_sales_installed": domain[
                                "is_converted_sales_installed"
                            ],
                        }
                    ],
                    "resulutions": [
                        {"date": d, "lead_count": c}
                        for d, c in self.leads_persistence.get_leads_count_by_day(
                            domain_id=domain["id"]
                        )
                    ],
                    "data_syncs": filtered_syncs,
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

        base_path = os.path.join(
            os.path.dirname(__file__), "data", "additional_pixels"
        )
        script_path = os.path.join(base_path, f"{action}.js")

        if not os.path.isfile(script_path):
            return {"status": "script_not_found"}

        with open(script_path, "r", encoding="utf-8") as f:
            script_template = f.read()

        script = script_template.replace("{{client_id}}", client_id)

        return script
