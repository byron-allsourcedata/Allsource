from config.util import getenv


class RecaptchaConfig:
    secret = getenv("RECAPTCHA_SECRET_KEY")
