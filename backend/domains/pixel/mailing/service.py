from pydantic import BaseModel
from domains.mailing.pixel_code.service import PixelCodeMailingService
from enums import SendgridTemplate
from resolver import injectable
from services.pixel_installation import PixelInstallationService


class MailingUserData(BaseModel):
    full_name: str
    email: str


class ManualPixelRequest(BaseModel):
    user_id: int
    domain_id: int


@injectable
class MailingPixelService:
    def __init__(
        self,
        pixel_code_mailing: PixelCodeMailingService,
        installation: PixelInstallationService,
    ) -> None:
        self.pixel_code_mailing = pixel_code_mailing
        self.installation = installation

    def get_manual_pixel_code(self, user_id: int, domain_id: int) -> str:
        pass

    def send_normal_pixel_code(
        self,
        user_data: MailingUserData,
        manual_pixel_req: ManualPixelRequest,
        from_user_id: int,
    ):
        pixel_code = self.get_manual_pixel_code(
            user_id=manual_pixel_req.user_id,
            domain_id=manual_pixel_req.domain_id,
        )

        self.pixel_code_mailing.send_pixel_code(
            full_name=user_data.full_name,
            user_email=user_data.email,
            template_id=SendgridTemplate.SEND_PIXEL_CODE_TEMPLATE.value,
            pixel_code=pixel_code,
            from_user_id=from_user_id,
        )
