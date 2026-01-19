import logging
from datetime import datetime, timedelta

from domains.pixel.mailing.schemas import MailingUserData, ManualPixelRequest
from models import UserDomains
from resolver import injectable
from enums import SendgridTemplate

from domains.mailing.exceptions import WaitMailTimeoutException
from domains.mailing.pixel_code.service import PixelCodeMailingService
from domains.pixel.mailing.exceptions import (
    PixelScriptNotFound,
    TemplateNotFound,
    UnknownScriptType,
)
from domains.pixel.manual import ManualPixelService
from domains.users.service import UsersService
from persistence.sendgrid_persistence import SendgridPersistence
from services.domains import UserDomainsService
from services.pixel_installation import PixelInstallationService
from services.pixel_management import PixelManagementService

logger = logging.getLogger(__name__)


@injectable
class MailingPixelService:
    def __init__(
        self,
        users: UsersService,
        pixel_code_mailing: PixelCodeMailingService,
        installation: PixelInstallationService,
        repo: SendgridPersistence,
        domains: UserDomainsService,
        send_grid_persistence_service: SendgridPersistence,
        pixel_management_service: PixelManagementService,
    ) -> None:
        self.users = users
        self.pixel_code_mailing = pixel_code_mailing
        self.installation = installation
        self.repo = repo
        self.domains = domains
        self.pixel_management_service = pixel_management_service
        self.send_grid_persistence_service = send_grid_persistence_service

    async def get_manual_pixel_code(
        self, user: dict, domain: UserDomains
    ) -> str:
        pixel_code, pixel_id = await self.installation.get_pixel_script(
            user=user, domain=domain
        )
        return pixel_code

    def can_send_pixel_email(self, pixel_code_sent_at: datetime | None):
        message_expiration_time = pixel_code_sent_at
        time_now = datetime.now()

        if message_expiration_time is None:
            return True

        if time_now < (message_expiration_time + timedelta(minutes=1)):
            return False

        return True

    async def send_normal_pixel_code(
        self,
        user: dict,
        domain: UserDomains,
        user_data: MailingUserData,
        manual_pixel_req: ManualPixelRequest,
    ):
        """
        Raises WaitMailTimoutException
        Raises TemplateNotFound

        auto-commits
        """
        from_user_id = manual_pixel_req.user_id

        pixel_code_last_sent = self.users.get_pixel_code_last_sent(
            user_id=from_user_id
        )

        if not self.can_send_pixel_email(pixel_code_last_sent):
            raise WaitMailTimeoutException()

        pixel_code = await self.get_manual_pixel_code(user=user, domain=domain)

        template_id = self.repo.get_template_by_alias(
            SendgridTemplate.SEND_PIXEL_CODE_TEMPLATE.value
        )

        if not template_id:
            raise TemplateNotFound()

        self.pixel_code_mailing.send_pixel_code(
            full_name=user_data.full_name,
            user_email=user_data.email,
            template_id=template_id,
            pixel_code=pixel_code,
            from_user_id=from_user_id,
        )
        self.users.set_pixel_code_last_sent(
            user_id=from_user_id,
            pixel_code_sent_at=datetime.now(),
        )

    def send_additional_pixel_code(
        self,
        email: str,
        script_type: str,
        install_type: str,
        user_id: int,
        message_expiration_time: datetime | None,
        domain_id: int,
    ):
        """
        Raises WaitMailTimoutException
        Raises TemplateNotFound
        Raises PixelScriptNotFound
        Raises UnknownScriptType
        """

        from_user_id = user_id

        if not self.can_send_pixel_email(message_expiration_time):
            raise WaitMailTimeoutException()

        script_map = {
            "view_product": {
                "default": SendgridTemplate.SEND_VIEW_PRODUCT_PIXEL_TEMPLATE_ON_LOAD.value,
            },
            "add_to_cart": {
                "default": SendgridTemplate.SEND_ADD_TO_CART_PIXEL_TEMPLATE_ON_LOAD.value,
                "button": SendgridTemplate.SEND_ADD_TO_CART_PIXEL_TEMPLATE_ON_CLICK.value,
            },
            "converted_sale": {
                "default": SendgridTemplate.SEND_CONVERTED_SALE_PIXEL_TEMPLATE_ON_LOAD.value,
                "button": SendgridTemplate.SEND_CONVERTED_SALE_PIXEL_TEMPLATE_ON_CLICK.value,
            },
        }

        if (
            script_type not in script_map
            or install_type not in script_map[script_type]
        ):
            raise UnknownScriptType()

        pixel_scripts = self.pixel_management_service.get_pixel_scripts(
            action=script_type, domain_id=domain_id
        )

        pixel_code = pixel_scripts.get(install_type)
        if pixel_code is None:
            raise PixelScriptNotFound()

        template_id = self.send_grid_persistence_service.get_template_by_alias(
            script_map[script_type][install_type]
        )

        if template_id is None:
            raise TemplateNotFound()

        full_name = email.split("@")[0]

        self.pixel_code_mailing.send_pixel_code(
            full_name=full_name,
            user_email=email,
            template_id=template_id,
            pixel_code=pixel_code,
            from_user_id=from_user_id,
        )

        self.users.set_pixel_code_last_sent(
            user_id=from_user_id,
            pixel_code_sent_at=datetime.now(),
        )
