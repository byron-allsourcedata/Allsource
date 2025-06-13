import logging
from typing import List

from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
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
