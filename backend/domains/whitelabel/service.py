import uuid
from fastapi import UploadFile

from domains.whitelabel.services.aws import WhitelabelAwsService
from .persistence import WhitelabelSettingsPersistence
from .schemas import WhitelabelSettingsSchema
from resolver import injectable


@injectable
class WhitelabelService:
    def __init__(
        self, repo: WhitelabelSettingsPersistence, aws: WhitelabelAwsService
    ):
        self.repo = repo
        self.aws = aws

    def get_whitelabel_settings(self, user_id: int) -> WhitelabelSettingsSchema:
        settings = self.repo.get_whitelabel_settings(user_id)

        if settings is None:
            return self.default_whitelabel_settings()

        return WhitelabelSettingsSchema(
            brand_name=settings.brand_name,
            brand_logo_url=settings.brand_logo_url,
            brand_icon_url=settings.brand_icon_url,
        )

    def default_whitelabel_settings(self) -> WhitelabelSettingsSchema:
        return WhitelabelSettingsSchema(
            brand_name="Allsource",
            brand_logo_url="/logo.svg",
            brand_icon_url="/logo-icon.svg",
        )

    def update_whitelabel_settings(
        self,
        user_id: int,
        brand_name: str,
        brand_logo: UploadFile | None,
        brand_icon: UploadFile | None,
    ):
        brand_logo_url = self.maybe_upload_image(brand_logo)
        brand_icon_url = self.maybe_upload_image(brand_icon)

        self.repo.update_whitelabel_settings(
            user_id, brand_name, brand_logo_url, brand_icon_url
        )

    def maybe_upload_image(self, image: UploadFile | None) -> str | None:
        if image is not None and image.content_type is not None:
            return self.upload_image(image.file.read(), image.content_type)
        return None

    def upload_image(self, content: bytes, content_type: str) -> str:
        image_name = self.get_image_s3_name(content_type)

        s3_url = self.aws.upload_image(
            image_name, content, content_type=content_type
        )
        return s3_url

    def get_image_s3_name(self, content_type: str):
        image_uuid = uuid.uuid4().hex
        extension = self.get_image_extension(content_type)
        if extension is None:
            raise Exception("Unsupported file type")

        return f"whitelabel/{image_uuid}.{extension}"

    def get_image_extension(self, content_type: str) -> str | None:
        if content_type == "image/jpeg":
            return "jpg"
        elif content_type == "image/png":
            return "png"
        elif content_type == "image/svg+xml":
            return "svg"
        return None
