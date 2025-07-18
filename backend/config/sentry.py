import logging
import os

import sentry_sdk

logger = logging.getLogger(__name__)


def before_send(event, hint):
    # Check if exception info exists and is a KeyboardInterrupt
    exc_info = hint.get("exc_info")
    if exc_info is not None:
        exc_type, _, _ = exc_info
        if issubclass(exc_type, KeyboardInterrupt):
            return None  # drop the event

    return event  # send everything else


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
                before_send=before_send,
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
                before_send=before_send,
                send_default_pii=True,
            )
        else:
            logger.warning("Error alerts are disabled")
