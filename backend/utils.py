from datetime import datetime, timedelta, timezone
import re
import os
import hashlib
import json
import regex
from urllib.parse import urlparse, parse_qs

from enums import ProccessDataSyncResult
from models.five_x_five_users import FiveXFiveUser
from services.integrations.million_verifier import MillionVerifierIntegrationsService


def get_utc_aware_date():
    return datetime.now(timezone.utc).replace(microsecond=0)

def get_md5_hash(email):
    md5_token_info = {
                    'user_mail': email,
                    'salt': os.getenv('SECRET_SALT')
                }
    json_string = json.dumps(md5_token_info, sort_keys=True)
    md5_hash = hashlib.md5(json_string.encode()).hexdigest()
    return md5_hash

def get_utc_aware_date_for_postgres():
    return get_utc_aware_date().isoformat()[:-6] + "Z"

def timestamp_to_date(timestamp):
        return datetime.fromtimestamp(timestamp)

def get_valid_email(user: FiveXFiveUser, million_verifier_integrations: MillionVerifierIntegrationsService) -> str:
    email_fields = [
        'business_email',
        'personal_emails',
        'additional_personal_emails',
    ]
    thirty_days_ago = datetime.now() - timedelta(days=30)
    thirty_days_ago_str = thirty_days_ago.strftime('%Y-%m-%d %H:%M:%S')
    verity = 0
    for field in email_fields:
        email = getattr(user, field, None)
        if email:
            emails = extract_first_email(email)
            for e in emails:
                if e and field == 'business_email' and user.business_email_last_seen:
                    if user.business_email_last_seen.strftime('%Y-%m-%d %H:%M:%S') > thirty_days_ago_str:
                        return e.strip()
                if e and field == 'personal_emails' and user.personal_emails_last_seen:
                    personal_emails_last_seen_str = user.personal_emails_last_seen.strftime('%Y-%m-%d %H:%M:%S')
                    if personal_emails_last_seen_str > thirty_days_ago_str:
                        return e.strip()
                if e and million_verifier_integrations.is_email_verify(email=e.strip()):
                    return e.strip()
                verity += 1
    if verity > 0:
        return ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value
    return ProccessDataSyncResult.INCORRECT_FORMAT.value

def get_valid_email_without_million(user: FiveXFiveUser) -> str:
    email_fields = [
        'business_email',
        'personal_emails',
        'additional_personal_emails',
    ]
    for field in email_fields:
        email = getattr(user, field, None)
        if email:
            emails = extract_first_email(email)
            for e in emails:
                return e
                
    return ProccessDataSyncResult.INCORRECT_FORMAT.value
    
def format_phone_number(phones):
    if phones:
        phone_list = phones.split(',')
        formatted_phones = []
        for phone in phone_list:
            phone_str = phone.strip()
            if phone_str.endswith(".0"):
                phone_str = phone_str[:-2]
            if not phone_str.startswith("+"):
                phone_str = f"+{phone_str}"
            formatted_phones.append(phone_str)

        return ', '.join(formatted_phones)

def extract_first_email(text: str) -> str:
    email_regex = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
    return re.findall(email_regex, text)

def create_company_alias(company_name):
    if company_name:
        company_name = company_name.strip()
        alias = regex.sub(r'[\p{Z}\s]+', ' ', company_name)
        alias = company_name.replace(" ", "_")
        alias = alias.lower()
        return alias
    
def validate_and_format_phone(phone_numbers: str) -> str:
    if not phone_numbers:
        return None
    phone_pattern = r'\+\d{11,15}'
    matches = re.findall(phone_pattern, phone_numbers)
    formatted_numbers = []
    for phone_number in matches:
        cleaned_phone_number = re.sub(r'\D', '', phone_number)
        if len(cleaned_phone_number) == 10: 
            formatted_phone_number = '+1' + cleaned_phone_number
            formatted_numbers.append(formatted_phone_number)
        elif len(cleaned_phone_number) == 11 and cleaned_phone_number.startswith('1'):
            formatted_phone_number = '+' + cleaned_phone_number
            formatted_numbers.append(formatted_phone_number)
        else:
            continue

    unique_numbers = sorted(formatted_numbers)
    return ', '.join(unique_numbers) if unique_numbers else None

def get_url_params_list(url: str) -> str:
    parsed_url = urlparse(url)
    params = parse_qs(parsed_url.query)
    param_list = [f"{key}={','.join(value)}" for key, value in params.items()]
    
    return ", ".join(param_list)

def normalize_url(url):
    """
    Normalize the URL by removing all query parameters and trailing slashes,
    as well as removing the 'http://' and 'https://' protocols.
    """
    if not url:
        return url

    url = url.replace('http://', '').replace('https://', '')

    scheme_end = url.find('://')
    if scheme_end != -1:
        scheme_end += 3
        scheme = url[:scheme_end]
        remainder = url[scheme_end:]
    else:
        scheme = ''
        remainder = url

    path_end = remainder.find('?')
    if path_end != -1:
        path = remainder[:path_end]
    else:
        path = remainder

    path = path.rstrip('/')
    normalized_url = scheme + path
    return normalized_url

def check_certain_urls(page, activate_certain_urls):
    page_path = re.sub(r'^(https?://)?(www\.)?', '', page).strip('/')
    urls_to_check = activate_certain_urls.split(', ')
    for url in urls_to_check:
        url = re.sub(r'^(https?://)?(www\.)?', '', url.strip()).strip('/')
        if (page_path == url) or (url in page_path):
            return True
    return False