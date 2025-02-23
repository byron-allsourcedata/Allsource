from datetime import datetime
from utils import format_phone_number
from models.integrations.integrations_users_sync import IntegrationUserSync
from persistence.domains import UserDomainsPersistence
from persistence.leads_persistence import LeadsPersistence
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from datetime import datetime, timedelta
from schemas.integrations.integrations import IntegrationCredentials
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from fastapi import HTTPException
from enums import IntegrationsStatus, SourcePlatformEnum, ProccessDataSyncResult
from httpx import Client
from utils import extract_first_email


class WebhookIntegrationService:

    def __init__(self, lead_persistence: LeadsPersistence, domain_persistence: UserDomainsPersistence, sync_persistence: IntegrationsUserSyncPersistence,
                 integration_persistence: IntegrationsPresistence, client: Client, million_verifier_integrations: MillionVerifierIntegrationsService):
        self.leads_persistence = lead_persistence
        self.domain_persistence = domain_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations
        self.integration_persistence = integration_persistence
        self.client = client
    
    def save_integration(self, domain_id: int, user: dict):
        credential = self.integration_persistence.get_credentials_for_service(domain_id=domain_id, service_name=SourcePlatformEnum.WEBHOOK.value)
        if credential:
            credential.is_failed = False
            credential.error_message = None
            self.integration_persistence.db.commit()
            return credential
        integration = self.integration_persistence.create_integration({
            'domain_id': domain_id,
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.WEBHOOK.value
        })
        if not integration:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return IntegrationsStatus.SUCCESS

    def add_integration(self, credentials: IntegrationCredentials, domain, user: dict):
        integration = self.save_integration(domain_id=domain.id, user=user)
        return integration

