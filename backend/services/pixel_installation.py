import hashlib
import logging
import os
import re
from typing import Optional

from datetime import timezone

from fastapi import HTTPException, status
from sqlalchemy import or_
from bs4 import BeautifulSoup
import requests

from config.domains import Domains
from enums import BaseEnum, SendgridTemplate, PixelStatus, DomainStatus
from models.users import Users
from models.users_domains import UserDomains
from datetime import datetime, timedelta
from db_dependencies import Db
from resolver import injectable
from schemas.pixel_installation import PixelInstallationResponse
from services.pixel_management import PixelManagementService
from utils import normalize_url
from persistence.sendgrid_persistence import SendgridPersistence
from services.sendgrid import SendgridHandler

logger = logging.getLogger(__name__)


@injectable
class PixelInstallationService:
    def __init__(
        self,
        db: Db,
        send_grid_persistence_service: SendgridPersistence,
        pixel_management_service: PixelManagementService,
    ):
        self.db = db
        self.send_grid_persistence_service = send_grid_persistence_service
        self.pixel_management_service = pixel_management_service

    def _get_or_create_client_id(self, user: dict, domain: UserDomains) -> str:
        if domain is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"status": DomainStatus.DOMAIN_NOT_FOUND.value},
            )

        client_id = domain.data_provider_id
        if client_id is None:
            client_id = hashlib.sha256(
                (str(domain.id) + os.getenv("SECRET_SALT")).encode()
            ).hexdigest()
            self.db.query(UserDomains).filter(
                UserDomains.user_id == user.get("id"),
                UserDomains.domain == domain.domain,
            ).update(
                {UserDomains.data_provider_id: client_id},
                synchronize_session=False,
            )
            self.db.commit()

        return client_id

    def get_manual(self, user: dict, domain: UserDomains):
        client_id = self._get_or_create_client_id(user, domain)

        pixel_script_domain = Domains.PIXEL_SCRIPT_DOMAIN
        script = (
            f'<script src="https://{pixel_script_domain}/pixel.js?dpid={client_id}"></script>'
            "\n"
            '<script type="text/javascript">'
            "\n"
            "    (function(s, p, i, c, e) {"
            "\n"
            "    s[e] = s[e] || function() { (s[e].a = s[e].a || []).push(arguments); };"
            "\n"
            "    s[e].l = 1 * new Date();"
            "\n"
            '    var k = c.createElement("script"), a = c.getElementsByTagName("script")[0];'
            "\n"
            "    k.async = 1, k.src = p, a.parentNode.insertBefore(k, a);"
            "\n"
            "    s.pixelClientId = i;"
            "\n"
            f'    }})(window, "https://allsource-data.s3.us-east-2.amazonaws.com/allsource_pixel.js", "{client_id}", document, "script");'
            "\n"
            "</script>"
        )

        return script, client_id

    def get_view_product_script(self, user: dict, domain: UserDomains) -> str:
        client_id = self._get_or_create_client_id(user, domain)
        return f"""<script>/* view_product code for {domain.domain} with ID {client_id} */</script>"""

    def get_add_to_cart_script_on_click(
        self, user: dict, domain: UserDomains
    ) -> str:
        client_id = self._get_or_create_client_id(user, domain)
        return f"""<script>/* add_to_cart code for {domain.domain} with ID {client_id} */</script>"""

    def get_converted_sale_script_on_click(
        self, user: dict, domain: UserDomains
    ) -> str:
        client_id = self._get_or_create_client_id(user, domain)
        return f"""<script>/* converted_sale code for {domain.domain} with ID {client_id} */</script>"""

    def get_add_to_cart_script_on_load(
        self, user: dict, domain: UserDomains
    ) -> str:
        client_id = self._get_or_create_client_id(user, domain)
        return f"""<script>/* add_to_cart code for {domain.domain} with ID {client_id} */</script>"""

    def get_converted_sale_script_on_load(
        self, user: dict, domain: UserDomains
    ) -> str:
        client_id = self._get_or_create_client_id(user, domain)
        return f"""<script>/* converted_sale code for {domain.domain} with ID {client_id} */</script>"""

    def send_pixel_code_in_email(
        self, email: str, user: dict, domain: UserDomains
    ):
        message_expiration_time = user.get("pixel_code_sent_at", None)
        time_now = datetime.now()
        if message_expiration_time is not None:
            if (message_expiration_time + timedelta(minutes=1)) > time_now:
                return BaseEnum.SUCCESS
        pixel_code, pixel_client_id = self.get_manual(user, domain)
        mail_object = SendgridHandler()
        template_id = self.send_grid_persistence_service.get_template_by_alias(
            SendgridTemplate.SEND_PIXEL_CODE_TEMPLATE.value
        )
        full_name = email.split("@")[0]
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=template_id,
            template_placeholder={
                "full_name": full_name,
                "pixel_code": pixel_code,
                "email": email,
            },
        )
        return BaseEnum.SUCCESS

    def parse_website(self, url, domain):
        try:
            response = requests.get(url)
        except:
            return False
        if response.status_code != 200:
            return False
        soup = BeautifulSoup(response.text, "html.parser")
        pixel_container = soup.find("script", id="acegm_pixel_script")
        if pixel_container:
            script_content = pixel_container.string
            client_id_match = re.search(
                r'window\.pixelClientId\s*=\s*"([^"]+)"', script_content
            )
            if client_id_match:
                pixel_client_id = client_id_match.group(1).strip()
                if domain.data_provider_id == pixel_client_id:
                    return True
        return False

    def check_pixel_installed_via_parse(self, url, user, domain):
        result = {"success": False}
        result_parser = self.parse_website(url, domain)

        if result_parser:
            self.db.query(UserDomains).filter(
                UserDomains.user_id == user.get("id"),
                or_(
                    UserDomains.domain == normalize_url(url),
                    UserDomains.domain == "www." + normalize_url(url),
                ),
            ).update(
                {
                    UserDomains.domain: normalize_url(url),
                    UserDomains.is_pixel_installed: True,
                    UserDomains.pixel_installation_date: datetime.now(
                        timezone.utc
                    ).replace(tzinfo=None),
                },
                synchronize_session=False,
            )

            self.db.commit()
            result["success"] = True
        result["user_id"] = user.get("id")
        return result

    def verify_and_mark_pixel(self, pixelClientId, url):
        result = {"status": PixelStatus.INCORRECT_PROVIDER_ID.value}
        domain = (
            self.db.query(UserDomains)
            .filter(UserDomains.data_provider_id == pixelClientId)
            .first()
        )
        if domain:
            result["status"] = PixelStatus.PIXEL_MISMATCH.value
            if normalize_url(domain.domain) == normalize_url(url):
                result["status"] = PixelStatus.PIXEL_CODE_INSTALLED.value
                domain.is_pixel_installed = True
                self.db.commit()
            user = (
                self.db.query(Users).filter(Users.id == domain.user_id).first()
            )
            result["user_id"] = user.id
        return result

    def check_pixel_installation_status(
        self, user: dict, select_domain: str
    ) -> Optional[PixelInstallationResponse]:
        row = (
            self.db.query(UserDomains.is_pixel_installed)
            .filter(
                UserDomains.user_id == user["id"],
                UserDomains.domain == select_domain,
            )
            .first()
        )

        if row is None:
            return None

        installed_flag = bool(row[0])
        return PixelInstallationResponse(pixel_installation=installed_flag)

    def send_additional_pixel_code_in_email(
        self,
        email: str,
        script_type: str,
        install_type: str,
        user: dict,
        domain: UserDomains,
    ) -> BaseEnum:
        message_expiration_time = user.get("pixel_code_sent_at", None)
        time_now = datetime.now()

        if (
            message_expiration_time is not None
            and (message_expiration_time + timedelta(minutes=1)) > time_now
        ):
            return BaseEnum.SUCCESS

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
            raise HTTPException(
                status_code=400, detail="Unknown script type or install type"
            )

        pixel_scripts = self.pixel_management_service.get_pixel_scripts(
            action=script_type, domain_id=domain.id
        )

        pixel_code = pixel_scripts.get(install_type)
        if not pixel_code:
            raise HTTPException(
                status_code=404, detail="Pixel script not found"
            )

        template_id = self.send_grid_persistence_service.get_template_by_alias(
            script_map[script_type][install_type]
        )

        full_name = email.split("@")[0]
        mail_object = SendgridHandler()
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=template_id,
            template_placeholder={
                "full_name": full_name,
                "pixel_code": pixel_code,
                "email": email,
            },
        )

        return BaseEnum.SUCCESS
