from datetime import datetime, timedelta
from typing import Optional, List, Dict

from enums import ProccessDataSyncResult
from models.five_x_five_users import FiveXFiveUser
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from utils import extract_first_email

EMAIL_FIELDS_EXAMPLE: List[str] = ['business_email', 'personal_emails', 'additional_personal_emails']

EMAIL_LAST_SEEN_EXAMPLE:  Dict[str, str] = {
    'business_email': 'business_email_last_seen',
    'personal_emails': 'personal_emails_last_seen',
}

def get_valid_email(
    user: FiveXFiveUser,
    email_verifier: MillionVerifierIntegrationsService,
    email_fields: List[str] = EMAIL_FIELDS_EXAMPLE,
    email_last_seen_fields: Dict[str, str] = EMAIL_LAST_SEEN_EXAMPLE
) -> str:
    thirty_days_ago = datetime.now() - timedelta(days=30)
    thirty_days_ago_str = thirty_days_ago.strftime('%Y-%m-%d %H:%M:%S')
    verity = 0

    for field in email_fields:
        email = getattr(user, field, None)
        if email:
            emails = extract_first_email(email)
            for e in emails:
                last_seen_field = email_last_seen_fields.get(field)
                if e and last_seen_field:
                    last_seen_value = getattr(user, last_seen_field, None)
                    if last_seen_value and last_seen_value.strftime('%Y-%m-%d %H:%M:%S') > thirty_days_ago_str:
                        return e.strip()
                if e and email_verifier.is_email_verify(email=e.strip()):
                    return e.strip()
                verity += 1

    if verity > 0:
        return ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value
    return ProccessDataSyncResult.INCORRECT_FORMAT.value

def get_valid_phone(user: FiveXFiveUser) -> Optional[str]:
    return (
        getattr(user, 'mobile_phone') or
        getattr(user, 'personal_phone') or
        getattr(user, 'direct_number') or
        getattr(user, 'company_phone', None)
    )

def get_valid_location(user: FiveXFiveUser) -> list:
    return [
            getattr(user, "personal_address") or getattr(user, "company_address", None),
            getattr(user, "personal_city") or getattr(user, "company_city", None),
            getattr(user, "personal_state") or getattr(user, "company_state", None),
            getattr(user, "personal_zip") or getattr(user, "company_zip", None),
        ]