import logging
import os

import sentry_sdk

logger = logging.getLogger(__name__)


class SentryConfig:
    SENTRY_DSN: str | None = os.getenv("SENTRY_DSN")

    @classmethod
    def capture(cls, e: Exception):
        if SentryConfig.SENTRY_DSN is not None and not isinstance(
            e, KeyboardInterrupt
        ):
            sentry_sdk.capture_exception(e)

    @classmethod
    def initialize(cls):
        if SentryConfig.SENTRY_DSN is not None:
            logger.info("Error alerts are enabled")
            sentry_sdk.init(
                dsn=SentryConfig.SENTRY_DSN,
                send_default_pii=True,
            )
        else:
            logger.warning("Error alerts are disabled")

    @classmethod
    async def async_initilize(cls):
        if SentryConfig.SENTRY_DSN is not None:
            logger.info("Error alerts are enabled")
            sentry_sdk.init(
                dsn=SentryConfig.SENTRY_DSN,
                send_default_pii=True,
            )
        else:
            logger.warning("Error alerts are disabled")
