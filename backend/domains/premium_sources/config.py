from config.util import getenv


class PremiumSourceConfig:
    BUCKET_NAME = getenv("S3_PREMIUM_SOURCE_BUCKET")
    REGION = getenv("S3_PREMIUM_SOURCE_REGION")
