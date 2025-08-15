from domains.whitelabel.schemas import WhitelabelSettingsSchema
from domains.whitelabel.service import WhitelabelService
from resolver import injectable
from schemas.users import UserSignUpForm
from services.users_auth import UsersAuth


@injectable
class SignupService:
    def __init__(
        self, auth_service: UsersAuth, whitelabel: WhitelabelService
    ) -> None:
        self.auth_service = auth_service
        self.whitelabel = whitelabel

    async def create_account(self, user_form: UserSignUpForm):
        whitelabel_settings = self.get_whitelabel_by_referral_code(
            user_form.referral
        )
        return await self.auth_service.create_account(
            user_form, whitelabel_settings
        )

    def get_whitelabel_by_referral_code(self, referral_code: str | None):
        if not referral_code:
            return WhitelabelSettingsSchema()
        return self.whitelabel.get_whitelabel_settings_by_referral_code(
            referral_code
        )
