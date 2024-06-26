from enum import Enum, auto


class StripePaymentStatusEnum(Enum):
    COMPLETE = auto()
    ONGOING = auto()
    PENDING = auto()
    FAILED = auto()

class SignUpStatus(Enum):
    SUCCESS = auto()
    NOT_VALID_EMAIL = auto()
    EMAIL_ALREADY_EXISTS = auto()
    PASSWORD_NOT_VALID = auto()
    ERROR = auto()

class AutomationSystemTemplate(Enum):
    EMAIL_VERIFICATION_TEMPLATE = auto()
