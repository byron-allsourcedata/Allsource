from datetime import datetime, timedelta, timezone
import re
import os
import hashlib
import json

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
        emails = re.findall(email_regex, text)
        if emails:
            return emails[0]
        return None
    
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
