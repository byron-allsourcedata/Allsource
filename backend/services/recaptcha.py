import requests
import logging

from config.recaptcha import RecaptchaConfig
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class RecaptchaService:
    def __init__(self):
        self.secret = RecaptchaConfig.secret

    def verify_recaptcha(self, token: str) -> bool:
        url = "https://www.google.com/recaptcha/api/siteverify"
        response = requests.post(
            url, data={"secret": self.secret, "response": token}
        )

        try:
            result = response.json()
        except Exception as e:
            logger.error("Failed to parse reCAPTCHA response", exc_info=e)
            return False

        success = result.get("success", False)
        if not success:
            logger.warning(f"reCAPTCHA failed: {result}")
        return success
