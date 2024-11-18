from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum

class ShopifyOrBigcommerceCredentials(BaseModel):
    shop_domain: str
    access_token: str

class ExternalAppInstalled(BaseModel):
    shop_domain: str

class WoocommerceCredentials(BaseModel):
    url: str
    consimer_key: str
    consumer_secret: str


class ApiKeyCredentials(BaseModel):
    api_key: str 


class MailchimpCredentials(BaseModel):
    data_center: str
    access_token: str


class MetaCredentials(BaseModel):
    access_token:str 

class SupperssionSet(BaseModel):
    suppression: bool


class IntegrationCredentials(BaseModel):
    shopify: Optional[ShopifyOrBigcommerceCredentials] = None
    woocommerce: Optional[WoocommerceCredentials] = None
    bigcommerce: Optional[ShopifyOrBigcommerceCredentials | ExternalAppInstalled] = None
    klaviyo: Optional[ApiKeyCredentials] = None
    mailchimp: Optional[ApiKeyCredentials] = None
    attentive: Optional[ApiKeyCredentials] = None
    meta: Optional[MetaCredentials] = None
    sendlane: Optional[ApiKeyCredentials] = None
    omnisend: Optional[ApiKeyCredentials] = None
    pixel_install: bool = False
    supperssion: bool = False


class Lead(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    mobile_phone: Optional[str]
    company_address: Optional[str]
    company_city: Optional[str]
    company_state: Optional[str]
    company_zip: Optional[str]
    business_email: Optional[EmailStr]
    time_spent: Optional[float]
    no_of_visits: Optional[int]
    no_of_page_visits: Optional[int]
    company_name: Optional[str]
    company_phone: Optional[str]
    company_revenue: Optional[float]
    company_employee_count: Optional[int]


class ExportLeads(BaseModel):
    list_name: str

class DataMap(BaseModel):
    type: str
    value: str

class SyncCreate(BaseModel):
    list_id: Optional[str] = None
    tags_id: Optional[str] = None
    list_name: Optional[str] = None
    integrations_users_sync_id: Optional[int] = None
    leads_type: Optional[str] = 'allContacts' 
    data_map: Optional[List[DataMap]] = None


class CreateListOrTags(BaseModel):
    name: str
    sender_id: Optional[str] = None
    description: Optional[str] = None
    ad_account_id: Optional[str] = None

class ContactSuppression(BaseModel):
    id: str
    email: str
    phone_number: Optional[str] = None

class ContactFiled(Enum):
    id = 'id'
    email = 'email'
    phone_number = 'phone_number'

class OrderAPI(BaseModel):
    platform_order_id: Optional[int] = None
    platform_user_id: Optional[str] = None
    platform_created_at: Optional[str] = None
    total_price: Optional[float] = None
    email: Optional[EmailStr] = None
    currency_code: Optional[str] = None

class ListFromIntegration(BaseModel):
    id: str
    list_name: str

class ReqestList(BaseModel):
    ad_account_id: Optional[str] = None
