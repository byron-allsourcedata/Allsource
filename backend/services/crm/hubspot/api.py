import logging

from config.hubspot import HubspotConfig
from resolver import injectable
from .client import HubspotClient
from .exceptions import AddingCRMContact
from .schemas import NewContactCRM, NewContactRequest
from .utils import default_association

logger = logging.getLogger(__name__)

@injectable
class HubspotAPI:
    def __init__(self, http: HubspotClient):
        self.http = http

    def crm_url(self, url: str) -> str:
        return f"{HubspotConfig.base_url}crm/v3/{url}"

    def add_contact(self, new_contact: NewContactCRM):
        try:
            logger.info("adding contact")
            if not HubspotConfig.enabled:
                return

            request = NewContactRequest(
                associations=[default_association()],
                properties=new_contact
            )

            logger.info(request.model_dump_json())
            response = self.http.post(
                self.crm_url("objects/contacts"),
                content=request.model_dump_json()
            )


            logger.info(response.json())
        except Exception as e:
            logger.error("error")
            raise AddingCRMContact(new_contact, e)
