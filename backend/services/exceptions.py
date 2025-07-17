import sentry_sdk


class InsufficientCreditsError(Exception):
    def __init__(self, message: str):
        super().__init__(message)


class MillionVerifierError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
