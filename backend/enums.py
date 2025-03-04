from enum import Enum


class BaseEnum(Enum):
    SUCCESS = 'SUCCESS'
    FAILURE = 'FAILURE'
    
class OauthShopify(Enum):
    USER_NOT_FOUND = 'USER_NOT_FOUND'
    NO_USER_CONNECTED = 'NO_USER_CONNECTED'
    NEED_UPGRADE_PLAN = 'NEED_UPGRADE_PLAN'
    ERROR_SHOPIFY_TOKEN = 'ERROR_SHOPIFY_TOKEN'
    NON_SHOPIFY_ACCOUNT = 'NON_SHOPIFY_ACCOUNT'

class BusinessType(Enum):
    D2C = 'd2c'
    B2B = 'b2b'

class CreateDataSync(Enum):
    ZAPIER_CONNECTED = 'ZAPIER_CONNECTED'
    
class SourcePlatformEnum(Enum):
    SHOPIFY = 'shopify'
    AWIN = 'awin'
    ATTENTIVE = 'attentive'
    BIG_COMMERCE = 'big_commerce'
    KLAVIYO = 'klaviyo'
    MAILCHIMP = 'mailchimp'
    META = 'meta'
    OMNISEND = 'omnisend'
    SENDLANE = 'sendlane'
    ZAPIER = 'zapier'
    WORDPRESS = 'wordpress'
    HUBSPOT = 'hubspot'
    SLACK = 'slack'
    GOOGLE_ADS = 'google_ads'
    WEBHOOK = 'webhook'
    SALES_FORCE = 'sales_force'


class UserPaymentStatusEnum(Enum):
    COMPLETE = 'COMPLETE'
    ONGOING = 'ONGOING'
    PENDING = 'PENDING'
    FAILED = 'FAILED'


class SubscriptionStatus(Enum):
    SUCCESS = "SUCCESS"
    INCOMPLETE = "INCOMPLETE"
    PAST_DUE = "PAST_DUE"
    CANCELED = "CANCELED"
    UNKNOWN = "UNKNOWN"
    NEED_UPGRADE_PLAN = 'NEED_UPGRADE_PLAN'
    SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND'
    SUBSCRIPTION_ALREADY_CANCELED = 'SUBSCRIPTION_ALREADY_CANCELED'
    DOWNGRADING = 'DOWNGRADING'


class SuppressionStatus(Enum):
    SUCCESS = 'SUCCESS'
    INCOMPLETE = 'INCOMPLETE'
    COMPLETED = 'COMPLETED'
    NO_EMAILS_FOUND = 'NO_EMAILS_FOUND'


class SettingStatus(Enum):
    INCORRECT_MAIL = 'INCORRECT_MAIL'
    SUCCESS = "SUCCESS"
    INCORRECT_PASSWORD = "INCORRECT_PASSWORD"
    RESEND_TOO_SOON = "RESEND_TOO_SOON"
    EMAIL_NOT_CONFIRMED = "EMAIL_NOT_CONFIRMED"
    FAILED = 'FAILED'
    ALREADY_INVITED = 'ALREADY_INVITED'
    INVITATION_LIMIT_REACHED = 'INVITATION_LIMIT_REACHED'
    INVITATION_LIMIT_NOT_REACHED = 'INVITATION_LIMIT_NOT_REACHED'
    INVALID_ACCESS_LEVEL = 'INVALID_ACCESS_LEVEL'
    OWNER_ROLE_CHANGE_NOT_ALLOWED = 'OWNER_ROLE_CHANGE_NOT_ALLOWED'


class VerificationEmail(Enum):
    EMAIL_ALREADY_VERIFIED = 'EMAIL_ALREADY_VERIFIED'
    EMAIL_VERIFIED = 'EMAIL_VERIFIED'
    EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED'
    CONFIRMATION_EMAIL_SENT = 'CONFIRMATION_EMAIL_SENT'
    RESEND_TOO_SOON = 'RESEND_TOO_SOON'


class UserAuthorizationStatus(Enum):
    SUCCESS = 'SUCCESS'
    NEED_CHOOSE_PLAN = 'NEED_CHOOSE_PLAN'
    NEED_CONFIRM_EMAIL = 'NEED_CONFIRM_EMAIL'
    FILL_COMPANY_DETAILS = 'FILL_COMPANY_DETAILS'
    NEED_BOOK_CALL = 'NEED_BOOK_CALL'
    PAYMENT_NEEDED = 'PAYMENT_NEEDED'
    PIXEL_INSTALLATION_NEEDED = 'PIXEL_INSTALLATION_NEEDED'
    TEAM_TOKEN_EXPIRED = 'TEAM_TOKEN_EXPIRED'
    INVALID_API_KEY = 'INVALID_API_KEY'


class MiddleWareEnum(Enum):
    NEED_EMAIL_CONFIRMATION = 'NEED_EMAIL_CONFIRMATION'


class SignUpStatus(Enum):
    NEED_CHOOSE_PLAN = 'NEED_CHOOSE_PLAN'
    NOT_VALID_EMAIL = 'NOT_VALID_EMAIL'
    EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS'
    PASSWORD_NOT_VALID = 'PASSWORD_NOT_VALID'
    NEED_CONFIRM_EMAIL = 'NEED_CONFIRM_EMAIL'
    FILL_COMPANY_DETAILS = 'FILL_COMPANY_DETAILS'
    TEAM_INVITATION_INVALID = 'TEAM_INVITATION_INVALID'
    INCORRECT_STATUS = 'INCORRECT_STATUS'
    INCORRECT_FULL_NAME = 'INCORRECT_FULL_NAME'
    INCORRECT_REFERRAL_CODE = 'INCORRECT_REFERRAL_CODE'
    SUCCESS = 'SUCCESS'


class TeamsInvitationStatus(Enum):
    PENDING = 'pending'


class TeamAccessLevel(Enum):
    ADMIN = 'admin'
    STANDARD = 'standard'
    READ_ONLY = 'read_only'
    OWNER = 'owner'


class LoginStatus(Enum):
    INCORRECT_PASSWORD_OR_EMAIL = 'INCORRECT_PASSWORD_OR_EMAIL'
    SUCCESS = 'SUCCESS'
    NEED_CHOOSE_PLAN = 'NEED_CHOOSE_PLAN'
    NEED_CONFIRM_EMAIL = 'NEED_CONFIRM_EMAIL'
    FILL_COMPANY_DETAILS = 'FILL_COMPANY_DETAILS'
    NOT_VALID_EMAIL = 'NOT_VALID_EMAIL'
    NEED_BOOK_CALL = 'NEED_BOOK_CALL'
    PAYMENT_NEEDED = 'PAYMENT_NEEDED'
    PIXEL_INSTALLATION_NEEDED = 'PIXEL_INSTALLATION_NEEDED'


class PixelStatus(Enum):
    PIXEL_CODE_INSTALLED = 'PIXEL_CODE_INSTALLED'
    PIXEL_CODE_PARSE_FAILED = 'PIXEL_CODE_PARSE_FAILED'
    USER_NOT_FOUND = 'USER_NOT_FOUND'

class UpdateUserStatus(Enum):
    SUCCESS = 'SUCCESS'
    USER_NOT_FOUND = 'USER_NOT_FOUND'

class UpdatePasswordStatus(Enum):
    PASSWORDS_DO_NOT_MATCH = 'PASSWORDS_DO_NOT_MATCH'
    PASSWORD_UPDATED_SUCCESSFULLY = 'PASSWORD_UPDATED_SUCCESSFULLY'


class SendgridTemplate(Enum):
    EMAIL_VERIFICATION_TEMPLATE = 'email_verification_template'
    FORGOT_PASSWORD_TEMPLATE = 'forgot_password_template'
    SEND_PIXEL_CODE_TEMPLATE = 'send_pixel_code_template'
    CHANGE_EMAIL_TEMPLATE = 'change_email_template'
    TEAM_MEMBERS_TEMPLATE = 'team_members_template'
    PAYMENT_INVOICE_TEMPLATE = 'payment_invoice_template'
    PAYMENT_FAILURE_NOTIFICATION = 'payment_failure_notification'
    PARTNER_INVITE_TEMPLATE='partner_invite_template'
    PARTNER_MESSAGE_TEMPLATE='partner_message_template'
    PARTNER_ENABLE_TEMPLATE='partner_enable_template'
    PARTNER_DISABLE_TEMPLATE='partner_disable_template'
    PARTNER_TERMINATE_TEMPLATE='partner_terminate_template'
    PARTNER_UPDATE_TEMPLATE='partner_update_commission'


class ResetPasswordEnum(Enum):
    SUCCESS = 'SUCCESS'
    NOT_VALID_EMAIL = 'NOT_VALID_EMAIL'
    RESEND_TOO_SOON = 'RESEND_TOO_SOON'


class CompanyInfoEnum(Enum):
    SUCCESS = 'SUCCESS'
    NEED_EMAIL_VERIFIED = 'NEED_EMAIL_VERIFIED'
    NEED_CHOOSE_PLAN = 'NEED_CHOOSE_PLAN'
    DASHBOARD_ALLOWED = 'DASHBOARD_ALLOWED'


class AudienceInfoEnum(Enum):
    SUCCESS = "SUCCESS"
    NOT_FOUND = "NOT_FOUND"
    NOT_VALID_NAME = 'NOT_VALID_NAME'
    ERROR_SEND_AUDIENCE = 'ERROR_SEND_AUDIENCE'


class PartnersAssetsInfoEnum(Enum):
    SUCCESS = "SUCCESS"
    NOT_VALID_DATA = "NOT_VALID_DATA"
    NOT_VALID_ID = 'NOT_VALID_ID'


class VerifyToken(Enum):
    SUCCESS = 'SUCCESS'
    EMAIL_ALREADY_VERIFIED = 'EMAIL_ALREADY_VERIFIED'
    INCORRECT_TOKEN = 'INCORRECT_TOKEN'


class DomainStatus(Enum):
    LAST_DOMAIN = 'LAST_DOMAIN'
    DOMAIN_NOT_FOUND = 'DOMAIN_NOT_FOUND'


class NotificationTitles(Enum):
    PLAN_LIMIT_EXCEEDED = 'plan_limit_exceeded'
    PAYMENT_FAILED = 'payment_failed'
    CONTACT_LIMIT_APPROACHING = 'contact_limit_approaching'
    CHOOSE_PLAN = 'choose_plan'
    PAYMENT_SUCCESS = 'payment_success'
    TEAM_MEMBER_ADDED = 'team_member_added'
    NO_CREDITS = 'no_credits'


class CreditsStatus(Enum):
    UNLIMITED_CREDITS = 'UNLIMITED_CREDITS'
    CREDITS_ARE_AVAILABLE = 'CREDITS_ARE_AVAILABLE'
    NO_CREDITS = 'NO_CREDITS'


class IntegrationsStatus(Enum):
    CREDENTAILS_INVALID = 'CREDENTIALS_INVALID'
    CREATE_IS_FAILED = 'CREATED_IS_FAILED'
    CREDENTIALS_NOT_FOUND = 'CREDENTIALS_NOT_FOUND'
    SUCCESS = "SUCCESS"
    NOT_MATCHED_EARLIER = "Store Domain does not match the one you specified earlier"
    ALREADY_EXIST = 'ALREADY_EXIST'
    INVALID_WEBHOOK_URL = 'INVALID_WEBHOOK_URL'
    JOIN_CHANNEL_IS_FAILED = 'JOIN_CHANNEL_IS_FAILED'


class StripeConnectStatus(Enum):
    SUCCESS_CONNECT = "SUCCESS_CONNECT"
    
class DataSyncImportedStatus(Enum):
    SENT = 'sent'
    SUCCESS = 'success'
    BEHAVIOR_MISS_MATCH = 'behavior_miss_match' 
    INCORRECT_FORMAT='incorrect_format'
    VERIFY_EMAIL_FAILED = 'verify_email_failed'

class ProccessDataSyncResult(Enum):
    INCORRECT_FORMAT='incorrect_format'
    FAILED = 'failed'
    SUCCESS = 'success'
    LEAD_PROFILE_ERROR = 'lead_profile_error'
    LIST_NOT_EXISTS = 'list_not_exists'
    AUTHENTICATION_FAILED = 'authentication_failed'
    TOO_MANY_REQUESTS = 'too_many_requests'
    VERIFY_EMAIL_FAILED = 'verify_email_failed'
    
class PlanAlias(Enum):
    PARTNERS = 'partners'
    
class ProgramType(Enum):
    PARTNER = 'partner'
    REFERRAL = 'referral'
    
class PayoutsStatus(Enum):
    PENDING = 'pending'
    PAID = 'paid'

class ConfirmationStatus(Enum):
    PENDING = 'pending'
    REJECT = 'reject'
    APPROVED = 'approved'
    
class PayOutReferralsStatus(Enum):
    SUCCESS = 'SUCCESS'
    NO_USERS_FOR_PAYOUT = 'NO_USERS_FOR_PAYOUT'
    PAYMENT_ERROR = 'PAYMENT_ERROR'
