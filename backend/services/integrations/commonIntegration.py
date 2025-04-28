from datetime import datetime, timedelta
from typing import Optional, List, Dict

from enums import ProccessDataSyncResult
from models.enrichment.enrichment_users import EnrichmentUser
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from utils import extract_first_email

EMAIL_FIELDS_EXAMPLE: List[str] = ['business_email', 'personal_emails', 'additional_personal_emails']

EMAIL_LAST_SEEN_EXAMPLE:  Dict[str, str] = {
    'business_email': 'business_email_last_seen',
    'personal_emails': 'personal_emails_last_seen',
}

def get_valid_email(emails_list: List[str]) -> str:
    for email in emails_list:
        return email
    return ProccessDataSyncResult.INCORRECT_FORMAT.value

def get_valid_phone(user: EnrichmentUser) -> Optional[str]:
    return (
        getattr(user, 'mobile_phone') or
        getattr(user, 'personal_phone') or
        getattr(user, 'direct_number') or
        getattr(user, 'company_phone', None)
    )

def get_valid_location(user: EnrichmentUser) -> list:
    return [
            getattr(user, "personal_address") or getattr(user, "company_address", None),
            getattr(user, "personal_city") or getattr(user, "company_city", None),
            getattr(user, "personal_state") or getattr(user, "company_state", None),
            getattr(user, "personal_zip") or getattr(user, "company_zip", None),
        ]