import logging

from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.leads_persistence import LeadsPersistence
from services.domains import UserDomainsService
from services.integrations.base import IntegrationService

logger = logging.getLogger(__name__)


class PixelManagementService:
    def __init__(
        self,
        user_domains_service: UserDomainsService,
        integration_service: IntegrationService,
    ):
        self.user_domains_service = user_domains_service
        self.integration_service = integration_service
        self.leads_persistence = LeadsPersistence

    def get_pixel_management_data(self, user_id):
        result = []
        domains = self.user_domains_service.get_domains(user_id=user_id)
        for domain in domains:
            syncs = self.integration_service.get_sync_domain(domain.id)
            result.append(
                {
                    "id": domain.id,
                    "domain_name": domain.domain,
                    "pixel_status": domain.is_pixel_installed,
                    "additional_pixel": [
                        {
                            "is_view_product_installed": domain.is_view_product_installed,
                            "is_add_to_cart_installed": domain.is_add_to_cart_installed,
                            "is_converted_sales_installed": domain.is_converted_sales_installed,
                        }
                    ],
                    "resulutions": "Source 1",
                    "data_sync": syncs,
                }
            )
        return result
