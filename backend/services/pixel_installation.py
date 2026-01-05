import hashlib
import logging
import os
import re
import uuid
from typing import Optional

from datetime import timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_
from bs4 import BeautifulSoup
import requests
from typing_extensions import deprecated

from config.domains import Domains
from enums import BaseEnum, SendgridTemplate, PixelStatus, DomainStatus
from models.users import Users
from models.users_domains import UserDomains
from datetime import datetime, timedelta
from db_dependencies import Db
from resolver import injectable
from schemas.pixel_installation import PixelInstallationResponse
from services.delivr import DelivrClientAsync
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
        delivr_api_service: DelivrClientAsync,
    ):
        self.db = db
        self.send_grid_persistence_service = send_grid_persistence_service
        self.pixel_management_service = pixel_management_service
        self.delivr_api_service = delivr_api_service

    @deprecated("Migrate to Delivr, use method _get_or_create_pixel_id instead")
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

    async def _get_or_create_pixel_id(
        self, user: dict, domain: UserDomains
    ) -> UUID:
        if domain is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"status": DomainStatus.DOMAIN_NOT_FOUND.value},
            )

        pixel_id = domain.pixel_id
        if pixel_id is None:
            project_id = user.get("delivr_project_id")
            if project_id is None:
                project_id = await self.delivr_api_service.create_project(
                    company_name=user.get("company_name"),
                    email=user.get("email"),
                )
                self.db.query(Users).filter(
                    Users.id == user.get("id"),
                ).update(
                    {Users.delivr_project_id: project_id},
                    synchronize_session=False,
                )

            pixel_id = await self.delivr_api_service.create_pixel(
                project_id=project_id, domain=domain.domain
            )
            self.db.query(UserDomains).filter(
                UserDomains.user_id == user.get("id"),
                UserDomains.domain == domain.domain,
            ).update(
                {UserDomains.pixel_id: pixel_id},
                synchronize_session=False,
            )
            self.db.commit()

        return pixel_id

    async def get_pixel_script(
        self, user: dict, domain: UserDomains
    ) -> tuple[str, UUID]:
        pixel_id = await self._get_or_create_pixel_id(user, domain)

        pixel_script_domain = Domains.PIXEL_SCRIPT_DOMAIN
        custom_script = f'<script src="https://{pixel_script_domain}/pixel.js?pid={pixel_id}"></script>'

        delivr_script = f'<script id="datatagmanager-id" src="https://cdn.pixel.datatagmanager.com/pixels/{pixel_id}/p.js" async></script>'

        combined_script = f"{custom_script}\n{delivr_script}"

        return combined_script, pixel_id

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

        try:
            pixel_uuid = uuid.UUID(pixelClientId)
        except (ValueError, TypeError):
            return {"status": PixelStatus.INCORRECT_PIXEL_ID.value}

        domain = (
            self.db.query(UserDomains)
            .filter(UserDomains.pixel_id == pixel_uuid)
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
