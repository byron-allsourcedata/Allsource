from config.folders import Folders
from pandas import DataFrame
import re
from typing import Optional
from models.enrichment.enrichment_user_contact import EnrichmentUserContact
import pandas as pd

FIELD_FILLERS = {
    'phone': lambda result, ctx: add_phone(result, ctx['main_phone']),
    'company': lambda result, ctx: add_company(result, ctx['professional_profiles']),
    'city': lambda result, ctx: add_city(result, ctx['postal']),
    'state': lambda result, ctx: add_state(result, ctx['postal']),
    'zip_code': lambda result, ctx: add_zip(result, ctx['personal_profiles']),
    'gender': lambda result, ctx: add_gender(result, ctx['personal_profiles']),
    'business_email': lambda result, ctx: add_business_email(result, ctx['business_email']),
    'personal_email': lambda result, ctx: add_personal_email(result, ctx['personal_email']),
    'country_code': lambda result, ctx: add_country_code(result, ctx['postal']),
    'business_email_last_seen_date': lambda result, ctx: add_business_email_last_seen_date(result, ctx['business_email_last_seen_date']),
    'personal_email_last_seen': lambda result, ctx: add_personal_email_last_seen(result, ctx['personal_email_last_seen']),
    'linkedin_url': lambda result, ctx: add_linkedin_url(result, ctx['linkedin_url']),
}


def get_states_dataframe() -> DataFrame:
        path = Folders.data('uszips.csv')
        dataframe = pd.read_csv(path, usecols=["zip", "city", "state_name"], dtype={"zip": str})
        return dataframe

def normalize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None

    cleaned = re.sub(r"[^\d+]", "", str(phone))
    if cleaned.startswith("+"):
        cleaned = cleaned[1:]

    if re.fullmatch(r"\d{10,15}", cleaned):
        return cleaned

    return None

def get_mail_email(business_email, personal_email, target_schema):
    preferred = business_email if target_schema == 'b2b' else personal_email
    fallback = personal_email if preferred == business_email else business_email
    return preferred or fallback

def get_email_by_emails(business_email, personal_email, other_emails, target_schema=None):
    target = (target_schema or '').lower()

    priority = {
        'b2b': [business_email, personal_email, other_emails],
        'b2c': [personal_email, business_email, other_emails]
    }

    for email in priority.get(target, [business_email, personal_email, other_emails]):
        if email:
            return email
    return None

def get_phone_by_phones(phone_mobile1, phone_mobile2):
    return normalize_phone(phone_mobile1) or normalize_phone(phone_mobile2)


def resolve_main_email_and_phone(
    enrichment_contacts,
    validations: dict,
    target_schema: Optional[str],
    business_email: str, 
    personal_email: str, 
    phone: str
):
    delivery_personal_email = next(
        (item['delivery'] for item in validations.get('personal_email', []) if 'delivery' in item),
        None
    )
    delivery_business_email = next(
        (item['delivery'] for item in validations.get('business_email', []) if 'delivery' in item),
        None
    )
    if target_schema:
        main_email = (
            get_mail_email(business_email, personal_email, target_schema)
            if delivery_personal_email or delivery_business_email
            else get_email_by_emails(
                business_email=enrichment_contacts.business_email,
                personal_email=enrichment_contacts.personal_email,
                other_emails=enrichment_contacts.other_emails,
                target_schema=target_schema
            )
        )

        main_phone = phone if validations.get('phone') else get_phone_by_phones(
            enrichment_contacts.phone_mobile1,
            enrichment_contacts.phone_mobile2
        )
    else:
        business_email = enrichment_contacts.business_email
        personal_email = enrichment_contacts.personal_email
        main_email = get_email_by_emails(
            business_email=enrichment_contacts.business_email,
            personal_email=enrichment_contacts.personal_email,
            other_emails=enrichment_contacts.other_emails,
            target_schema=None
        )
        main_phone = get_phone_by_phones(
            enrichment_contacts.phone_mobile1,
            enrichment_contacts.phone_mobile2
        )
        
    return main_email, main_phone



def add_phone(result: dict, main_phone: Optional[str]) -> None:
    if main_phone:
        result['phone'] = main_phone

def add_business_email(result: dict, business_email: Optional[str]) -> None:
    if business_email:
        result['business_email'] = business_email
        
def add_personal_email(result: dict, personal_email: Optional[str]) -> None:
    if personal_email:
        result['personal_email'] = personal_email
        
def add_linkedin_url(result: dict, enrichment_contacts: EnrichmentUserContact) -> None:
    if enrichment_contacts:
        result['linkedin_url'] = enrichment_contacts.linkedin_url

def add_company(result: dict, professional_profiles) -> None:
    if professional_profiles and professional_profiles.current_company_name:
        result['company_name'] = professional_profiles.current_company_name


def add_city(result: dict, postal) -> None:
    if postal:
        city = postal.home_city or postal.business_city
        if city:
            result['city'] = city


def add_state(result: dict, postal) -> None:
    if postal:
        state = postal.home_state or postal.business_state
        if state:
            result['state'] = state
            
def add_country_code(result: dict, postal) -> None:
    if postal:
        country_code = postal.home_country or postal.business_country
        if country_code:
            result['country_code'] = country_code      

def add_zip(result: dict, personal_profiles) -> None:
    if personal_profiles and personal_profiles.zip_code5:
        result['zip'] = str(personal_profiles.zip_code5)


def add_gender(result: dict, personal_profiles) -> None:
    if personal_profiles and personal_profiles.gender in (1, 2):
        result['gender'] = 'm' if personal_profiles.gender == 1 else 'f'
        
def add_business_email_last_seen_date(result: dict, enrichment_contacts: EnrichmentUserContact) -> None:
    if enrichment_contacts:
        business_email_last_seen_date = enrichment_contacts.business_email_last_seen_date
        if business_email_last_seen_date:
            result['business_email_last_seen_date'] = business_email_last_seen_date.strftime('%Y-%m-%d %H:%M:%S')
        
def add_personal_email_last_seen(result: dict, enrichment_contacts: EnrichmentUserContact) -> None:
    if enrichment_contacts:
        personal_email_last_seen = enrichment_contacts.personal_email_last_seen
        if personal_email_last_seen:
            result['personal_email_last_seen'] = personal_email_last_seen.strftime('%Y-%m-%d %H:%M:%S')