from config.util import getenv


class SentryConfig:
    SENTRY_DSN = getenv("SENTRY_DSN", optional=True)