import logging

from config.hubspot import HubspotConfig
from resolver import injectable
from .client import HubspotClient
from .exceptions import AddingCRMContact, UpdateContactStatusException
from .schemas import NewContactCRM, NewContactRequest, UpdateContactStatusRequest, HubspotLeadStatus

logger = logging.getLogger(__name__)


@injectable
class HubspotAPI:
    """
        Methods to interact with Hubspot.

        Hubspot may be disabled, and each method should contain a check to see if it is enabled.
    """

    def __init__(self, http: HubspotClient):
        self.http = http

    def crm_url(self, url: str) -> str:
        return f"{HubspotConfig.base_url}crm/v3/{url}"

    def is_disabled(self):
        return not HubspotConfig.is_enabled()

    def add_contact(
        self, new_contact: NewContactCRM
    ):
        """
            :raises AddingCRMContact:
        """
        if self.is_disabled():
            return
        try:
            request = NewContactRequest(
                associations=[],
                properties=new_contact
            )

            self.http.post(
                self.crm_url("objects/contacts"),
                content=request.model_dump_json()
            )

        except Exception as e:
            raise AddingCRMContact(new_contact, e) from e

    def update_status(
        self,
        email: str,
        new_status: HubspotLeadStatus
    ):
        if self.is_disabled():
            return

        try:
            request = UpdateContactStatusRequest.new(new_status)
            self.http.patch(
                self.crm_url(f"objects/contacts/{email}?idProperty=email"),
                content=request.model_dump_json()
            )
        except Exception as e:
            raise UpdateContactStatusException() from e
