from .persistence import WhitelabelSettingsPersistence
from .schemas import WhitelabelSettingsSchema
from resolver import injectable


@injectable
class WhitelabelService:
    def __init__(self, repo: WhitelabelSettingsPersistence):
        self.repo = repo

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
        return WhitelabelSettingsSchema()

    def update_whitelabel_settings(
        self,
        user_id: int,
        brand_name: str,
        brand_logo_url: str,
        brand_icon_url: str,
    ):
        return self.repo.update_whitelabel_settings(
            user_id, brand_name, brand_logo_url, brand_icon_url
        )
