from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr

class MailchimpCustomer(BaseModel):
    mailchimp_user_id: str
    email: str
    unique_email_id: Optional[str]
    contact_id: Optional[str]
    full_name: Optional[str]
    web_id: Optional[int]
    email_type: Optional[str]
    status: Optional[str]
    unsubscribe_reason: Optional[str]
    consents_to_one_to_one_messaging: Optional[bool]
    merge_fields_property1: Optional[str]
    merge_fields_property2: Optional[str]
    interests_property1: Optional[bool]
    interests_property2: Optional[bool]
    stats_avg_open_rate: Optional[float]
    stats_avg_click_rate: Optional[float]
    ecommerce_total_revenue: Optional[float]
    ecommerce_number_of_orders: Optional[int]
    ecommerce_currency_code: Optional[str]
    ip_signup: Optional[str]
    timestamp_signup: Optional[datetime]
    ip_opt: Optional[str]
    timestamp_opt: Optional[datetime]
    member_rating: Optional[int]
    last_changed: Optional[datetime]
    language: Optional[str]
    vip: Optional[bool]
    email_client: Optional[str]
    location_latitude: Optional[float]
    location_longitude: Optional[float]
    location_gmtoff: Optional[int]
    location_dstoff: Optional[int]
    location_country_code: Optional[str]
    location_timezone: Optional[str]
    location_region: Optional[str]
    marketing_permission_id: Optional[str]
    marketing_permission_text: Optional[str]
    marketing_permission_enabled: Optional[bool]

class MailchimpProfile(BaseModel):
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    organization: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    location: Optional[Any] = None
    status: Optional[str] = None
    email_type: Optional[str] = None
