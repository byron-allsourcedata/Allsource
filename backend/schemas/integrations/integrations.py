from pydantic import BaseModel, EmailStr
from typing import Optional, List


class ShopifyOrBigcommerceCredentials(BaseModel):
    shop_domain: str
    access_token: str


class WoocommerceCredentials(BaseModel):
    url: str
    consimer_key: str
    consumer_secret: str


class KlaviyoOrSandlaneCredentials(BaseModel):
    api_key: str 


class MailchimpCredentials(BaseModel):
    data_center: str
    access_token: str


class FacebookCredentials(BaseModel):
    access_token: str
    ad_account_id: str



class IntegrationCredentials(BaseModel):
    shopify: Optional[ShopifyOrBigcommerceCredentials] = None
    woocommerce: Optional[WoocommerceCredentials] = None
    bigcommerce: Optional[ShopifyOrBigcommerceCredentials] = None
    klaviyo: Optional[KlaviyoOrSandlaneCredentials] = None
    mailchimp: Optional[MailchimpCredentials] = None
    facebook: Optional[FacebookCredentials] = None
    sendlane: Optional[KlaviyoOrSandlaneCredentials] = None
    pixel_install: bool = False


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
    leads_type: Optional[str] = 'All'
    data_map: List[DataMap]

class CreateListOrTags(BaseModel):
    name: str

