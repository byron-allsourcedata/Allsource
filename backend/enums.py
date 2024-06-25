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


class Permission(int, Enum):
    ANALYTICS = auto()
    AUTOMATION_EDIT = auto()
    CAMPAIGN_CLOSE = auto()
    CAMPAIGN_CREATE = auto()
    CAMPAIGN_DELETE = auto()
    CAMPAIGN_EDIT = auto()
    CREATIVE = auto()
    CREATIVE_POSTURL = auto()
    CREATORS_UPLOAD = auto()
    CREATOR_DOWNLOAD = auto()
    CREATOR_SHORTLIST = auto()
    DISCVOVERY = auto()
    ECOMMERCE_INTEGRATION = auto()
    JOB_CLOSE = auto()
    JOB_CREATE = auto()
    JOB_DELETE = auto()
    JOB_EDIT = auto()
    JOB_SEND = auto()
    LIST_ADD = auto()
    LIST_CREATE = auto()
    MARKETPLACE = auto()
    MESSAGE = auto()
    PAYMENT = auto()
    STRIPE = auto()


class SubscriptionsCodes(int, Enum):
    SUB_EXPIRED = auto()
    TRIAL_EXPIRED = auto()
    PAYMENT_FAILED = auto()
    SUB_NOT_FOUND = auto()
    EMAIL_IS_NOT_CONFIRMED = auto()


class AutomationSystemTemplate(Enum):
    EMAIL_VERIFICATION_TEMPLATE = auto()
