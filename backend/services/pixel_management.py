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
from dotenv import load_dotenv
from config.util import getenv

logger = logging.getLogger(__name__)

load_dotenv()


@injectable
class PixelManagementService:
    def __init__(
        self,
        user_domains_service: UserDomainsService,
        integration_service: Annotated[
            IntegrationService, Depends(get_integration_service)
        ],
        lead_persistence: LeadsPersistence,
        user_domain_persistence: UserDomainsPersistence,
    ):
        self.user_domains_service = user_domains_service
        self.domain_persistence = user_domain_persistence
        self.integration_service = integration_service
        self.leads_persistence = lead_persistence

    def get_pixel_management_data(self, user_id) -> List[ManagementResult]:
        result = []

        contacts_resolving_ids = (
            self.domain_persistence.get_domains_with_contacts_resolving(user_id)
        )

        domains = self.user_domains_service.get_domains(user_id=user_id)
        for domain in domains:
            syncs = self.integration_service.get_sync_domain(domain["id"])

            result.append(
                {
                    "id": domain["id"],
                    "domain_name": domain["domain"],
                    "pixel_status": domain["is_pixel_installed"],
                    "contacts_resolving": domain["id"]
                    in contacts_resolving_ids,
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
                    "resolutions": [
                        {"date": d, "lead_count": c}
                        for d, c in self.leads_persistence.get_leads_count_by_day(
                            domain_id=domain["id"]
                        )
                    ],
                    "data_syncs_count": len(syncs),
                }
            )

        return result

    def get_pixel_scripts(self, action: str, domain_id: int):
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

        data_path = getenv("DATA_FOLDER")
        script_names = [f"{action}.js"]
        if action != "view_product":
            script_names.append(f"{action}_button.js")

        result: dict[str, str | None] = {}

        result["button"] = None
        result["default"] = None
        for name in script_names:
            script_path = os.path.join(data_path, "additional_pixels", name)
            if os.path.isfile(script_path):
                with open(script_path, "r", encoding="utf-8") as f:
                    content = f.read()
                if name.endswith("_button.js"):
                    result["button"] = content.replace(
                        "{{client_id}}", client_id
                    )
                else:
                    result["default"] = content.replace(
                        "{{client_id}}", client_id
                    )

        return result
