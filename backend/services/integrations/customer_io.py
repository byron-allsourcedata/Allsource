import logging
import uuid
from typing import Any

from customerio.analytics import Client
from fastapi import HTTPException
from sqlalchemy import Row, select
from sqlalchemy.orm import Session

from db_dependencies import Db
from enums import (
    DataSyncImportedStatus,
    ProccessDataSyncResult,
    SourcePlatformEnum,
    IntegrationLimit,
    IntegrationsStatus,
    DataSyncType,
)
from models import UserDomains
from models.data_sync_imported_leads import DataSyncImportedLead
from models.five_x_five_users import FiveXFiveUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.leads_users import LeadUser
from persistence.integrations.integrations_persistence import (
    IntegrationsPersistence,
)
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.user_persistence import UserDict
from resolver import injectable
from schemas.integrations.integrations import IntegrationCredentials, DataMap
from services.integrations.abstract_integration_service import (
    AbstractIntegrationService,
    IntegrationLeadStatus,
)
from services.integrations.million_verifier import (
    MillionVerifierIntegrationsService,
)
from services.integrations.million_verifier_exceptions import VerificationEmailException
from utils import (
    validate_and_format_phone,
    get_valid_phone,
    get_valid_location,
    get_valid_email,
)

logger = logging.getLogger(__name__)


@injectable
class CustomerIoIntegrationsService(AbstractIntegrationService):
    CONSTANT_FIELD_NAME_MAX_LENGTH = 25
    CONSTANT_FIELD_VALUE_MAX_LENGTH = 30

    def __init__(
        self,
        integrations_persistence: IntegrationsPersistence,
        sync_persistence: IntegrationsUserSyncPersistence,
        million_verifier_integrations: MillionVerifierIntegrationsService,
    ):
        self.integrations_persistence = integrations_persistence
        self.sync_persistence = sync_persistence
        self.million_verifier_integrations = million_verifier_integrations

    def _get_api_token(self, user_integration: UserIntegration) -> str:
        return user_integration.access_token

    def _init_client(self, api_token: str):
        client = Client(
            write_key=api_token,
            debug=False,
            send=True,
            upload_size=IntegrationLimit.CUSTOMER_IO.value,
            max_queue_size=10000,
            upload_interval=0.5,
            gzip=False,
        )

        return client

    def add_integration(
        self,
        credentials: IntegrationCredentials,
        domain: UserDomains,
        user: UserDict,
    ) -> UserIntegration:
        user_integration = self.integrations_persistence.get_user_integration(
            user_id=user["id"],
            service_name=SourcePlatformEnum.CUSTOMER_IO.value,
        )

        # If user integration already exists -> update it
        if user_integration:
            return self.integrations_persistence.update_credential_for_service(
                user_id=user["id"],
                service_name=SourcePlatformEnum.CUSTOMER_IO.value,
                new_access_token=credentials.customer_io.api_key,
            )

        # Else -> create new user integration
        api_key = credentials.customer_io.api_key

        integration_data = {
            "access_token": api_key,
            "user_id": user.get("id"),
            "full_name": user.get("full_name"),
            "service_name": SourcePlatformEnum.CUSTOMER_IO.value,
            "limit": IntegrationLimit.CUSTOMER_IO.value,
        }

        integration = self.integrations_persistence.create_integration(
            integration_data
        )

        if not integration:
            raise HTTPException(
                status_code=409,
                detail={"status": IntegrationsStatus.CREATE_IS_FAILED.value},
            )

        return integration

    async def create_sync(
        self,
        domain_id: int,
        created_by: str,
        user: UserDict,
        leads_type: str | None,
        data_map: list[DataMap] | None,
    ):
        user_integration = self.integrations_persistence.get_user_integration(
            user_id=user["id"],
            service_name=SourcePlatformEnum.CUSTOMER_IO.value,
        )

        sync = self.sync_persistence.create_sync(
            {
                "integration_id": user_integration.id,
                "sent_contacts": -1,
                "sync_type": DataSyncType.CONTACT.value,
                "leads_type": leads_type,
                "data_map": data_map,
                "domain_id": domain_id,
                "created_by": created_by,
            }
        )
        return sync

    def edit_sync(
        self,
        leads_type: str,
        integrations_users_sync_id: int,
        domain_id: int,
        created_by: str,
        user_id: int | None,
        data_map: list[DataMap] | None,
    ):
        user_integration = self.integrations_persistence.get_user_integration(
            user_id=user_id,
            domain_id=domain_id,
            service_name=SourcePlatformEnum.CUSTOMER_IO.value,
        )

        sync = self.sync_persistence.edit_sync(
            {
                "integration_id": user_integration.id,
                "leads_type": leads_type,
                "data_map": data_map,
                "created_by": created_by,
            },
            integrations_users_sync_id,
        )
        return sync

    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: list[tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
    ) -> list[IntegrationLeadStatus]:
        data_map: list[DataMap] = [
            DataMap(**item) for item in integration_data_sync.data_map
        ]

        # Init Customer.io client
        api_token = self._get_api_token(user_integration=user_integration)
        client = self._init_client(api_token)

        # Send leads
        results: list[IntegrationLeadStatus] = []

        for lead_user, fxf_user in user_data:
            try:
                customer_io_traits = await self._map_lead(
                    fxf_user, data_map, is_email_validation_enabled
                )

                user_id = str(
                    uuid.uuid5(uuid.NAMESPACE_DNS, customer_io_traits["email"])
                )
                is_success, resp = client.identify(
                    user_id=user_id, traits=customer_io_traits
                )

                if is_success:
                    results.append(
                        IntegrationLeadStatus(
                            lead_id=lead_user.id,
                            status=ProccessDataSyncResult.SUCCESS.value,
                        )
                    )
                else:
                    results.append(
                        IntegrationLeadStatus(
                            lead_id=lead_user.id,
                            status=ProccessDataSyncResult.UNEXPECTED_ERROR.value,
                        )
                    )
                    logger.error(
                        f"API Client failed to send user with lead_id={lead_user.id}, 5x5_user_id={fxf_user.id}"
                    )
            except VerificationEmailException as e:
                logger.info(e.message)
                results.append(
                    IntegrationLeadStatus(
                        lead_id=lead_user.id,
                        status=ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value,
                    )
                )
            except Exception as e:
                logger.error(
                    f"Failed to send user with lead_id={lead_user.id}, 5x5_user_id={fxf_user.id}, exception found:\n{e}"
                )

        client.flush()

        return results

    def _get_email(self, fxf_user: FiveXFiveUser) -> str | None:
        return getattr(fxf_user, "business_email", None) or getattr(
            fxf_user, "personal_emails", None
        )

    def _get_phone(self, fxf_user: FiveXFiveUser) -> str:
        return validate_and_format_phone(get_valid_phone(fxf_user))

    async def _map_lead(
        self,
        fxf_user: FiveXFiveUser,
        data_map: list[DataMap],
        is_email_validation_enabled: bool,
    ) -> dict:
        """
        Raises:
            VerificationEmailException - raises when is_email_validation_enabled=True, but can't verify user
        """

        # Necessary fields

        if is_email_validation_enabled:
            email = await get_valid_email(
                fxf_user, self.million_verifier_integrations
            )

            if email in (ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value, ProccessDataSyncResult.INCORRECT_FORMAT.value):
                raise VerificationEmailException(f"Failed to verify 5x5_user {fxf_user.id}")
        else:
            email = self._get_email(fxf_user)

        firstName = getattr(fxf_user, "first_name", None)
        lastName = getattr(fxf_user, "last_name", None)
        address_info = get_valid_location(fxf_user)
        phone = validate_and_format_phone(get_valid_phone(fxf_user))

        customer_io_traits = {
            "email": email,
            "firstName": firstName,
            "lastName": lastName,
            "name": f"{firstName} {lastName}",
            "address": {
                "street": address_info.address,
                "city": address_info.city,
                "state": address_info.state,
                "postalCode": address_info.zip,
            },
            "phone": phone,
            "gender": getattr(fxf_user, "gender", None),
            "company_name": getattr(fxf_user, "company_name", None),
        }

        # Additional fields
        for data_map_item in data_map:
            # Add constant fields to profile
            if data_map_item.is_constant:
                truncated_name = data_map_item.type[:self.CONSTANT_FIELD_NAME_MAX_LENGTH]
                truncated_value = data_map_item.value[:self.CONSTANT_FIELD_VALUE_MAX_LENGTH]
                customer_io_traits[truncated_name] = truncated_value
            else:
                customer_io_traits[data_map_item.type] = fxf_user.__dict__[
                    data_map_item.type
                ]

        return customer_io_traits

    def test_api_token(self, api_token: str) -> bool:
        """To connect to Customer.io there is need to send test call"""

        try:
            test_client = Client(write_key=api_token)
            is_success, _ = test_client.identify(
                user_id=1,
                traits={
                    "name": "Allsource",
                    "email": "support@allsourcedata.com",
                },
            )

            return is_success

        except Exception as e:
            logger.error(
                f"Unexpected error during testing Customer.io connection. Exception: {e}"
            )
            return False


def check_correct_data_sync(
    data_sync_id: int, data_sync_imported_ids: list[int], session: Session
) -> tuple[Any, list[Row[tuple[Any]]]] | None:
    integration_data = (
        session.query(UserIntegration, IntegrationUserSync)
        .join(
            IntegrationUserSync,
            IntegrationUserSync.integration_id == UserIntegration.id,
        )
        .filter(IntegrationUserSync.id == data_sync_id)
        .first()
    )

    if not integration_data:
        logging.info("Data sync not found")
        return None

    result = (
        session.query(DataSyncImportedLead.lead_users_id.label("lead_users_id"))
        .filter(
            DataSyncImportedLead.id.in_(data_sync_imported_ids),
            DataSyncImportedLead.status == DataSyncImportedStatus.SENT.value,
        )
        .all()
    )
    return integration_data, result


def get_lead_attributes(session, lead_user_ids):
    five_x_five_users = (
        session.query(LeadUser, FiveXFiveUser)
        .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
        .filter(LeadUser.id.in_(lead_user_ids))
        .all()
    )
    if five_x_five_users:
        leads = five_x_five_users
        return leads
    else:
        return None


def get_datasync_imported_ids(db_session: Db, data_sync_id: int):
    stmt = select(DataSyncImportedLead.id).where(
        DataSyncImportedLead.data_sync_id == data_sync_id
    )
    return db_session.execute(stmt).scalars().all()
