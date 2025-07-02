from persistence.opt_out import OptOutPersistence
from resolver import injectable
from services.recaptcha import RecaptchaService


@injectable
class OptOutService:
    def __init__(
        self,
        opt_out_persistence: OptOutPersistence,
        recaptcha_service: RecaptchaService,
    ):
        self.opt_out_persistence = opt_out_persistence
        self.recaptcha_service = recaptcha_service

    def process_opt_out(
        self, email: str, recaptcha_token: str, ip_address: str
    ) -> None:
        if not self.recaptcha_service.verify_recaptcha(recaptcha_token):
            raise ValueError("Invalid reCAPTCHA")

        self.opt_out_persistence.save_opt_out(
            email=email, ip_address=ip_address
        )
