from config.sendgrid import MailingConfig
from domains.mailing.schemas import FilledWhitelabelSettingsSchema
from domains.whitelabel.schemas import WhitelabelSettingsSchema
from domains.whitelabel.service import WhitelabelService
from resolver import injectable


@injectable
class MailingWhitelabelService:
    def __init__(self, whitelabel: WhitelabelService) -> None:
        self.whitelabel = whitelabel

    def get_template_variables(
        self, user_id: int
    ) -> FilledWhitelabelSettingsSchema:
        partial_whitelabel_settings = self.whitelabel.get_whitelabel_settings(
            user_id
        )
        return self.fill_whitelabel_settings(partial_whitelabel_settings)

    def fill_whitelabel_settings(
        self, settings: WhitelabelSettingsSchema
    ) -> FilledWhitelabelSettingsSchema:
        default_logo_src = MailingConfig.default_logo_src
        default_whitelabel_name = MailingConfig.default_whitelabel_name

        brand_logo: str = default_logo_src
        whitelabel_name: str = default_whitelabel_name

        if settings.brand_logo_url is not None:
            brand_logo = settings.brand_logo_url
        if settings.brand_name is not None:
            whitelabel_name = settings.brand_name

        return FilledWhitelabelSettingsSchema(
            brand_name=whitelabel_name,
            brand_logo_url=brand_logo,
        )
