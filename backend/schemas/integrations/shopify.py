from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class ShopifyCustomer(BaseModel):
    shopify_user_id: int
    email: EmailStr
    updated_at: datetime
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    orders_count: int
    state: Optional[str] = None
    total_spent: Optional[str] = '0.00'
    last_order_id: Optional[int] = None
    note: Optional[str] = None
    verified_email: bool
    multipass_identifier: Optional[str] = None
    tax_exempt: bool
    tags: Optional[str] = None
    last_order_name: Optional[str] = None
    currency: Optional[str] = 'GBP'
    phone: Optional[str] = None
    accepts_marketing: bool
    accepts_marketing_updated_at: Optional[str] = None
    marketing_opt_in_level: Optional[str] = None
    email_marketing_consent_state: Optional[str] = None
    email_marketing_consent_opt_in_level: Optional[str] = None
    sms_marketing_consent_state: Optional[str] = None
    admin_graphql_api_id: Optional[str] = None
    address_id: Optional[int] = None
    address_first_name: Optional[str] = None
    address_last_name: Optional[str] = None
    address_company: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    address_city: Optional[str] = None
    address_province: Optional[str] = None
    address_country: Optional[str] = None
    address_zip: Optional[str] = None
    address_phone: Optional[str] = None
    address_name: Optional[str] = None
    address_province_code: Optional[str] = None
    address_country_code: Optional[str] = None
    address_country_name: Optional[str] = None
    address_default: Optional[bool] = False


class ShopifyOrderAPI(BaseModel):
    order_shopify_id: int 
    shopify_user_id: int
    total_price: float
    currency_code: str
    created_at_shopify: str
    email: EmailStr