from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum
from uuid import UUID


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


class HubSpotCredentials(BaseModel):
    access_token: str


class MailchimpCredentials(BaseModel):
    data_center: str
    access_token: str


class GoogleAdsCredentials(BaseModel):
    code: str
    scope: str


class GoHighLevelCredentials(BaseModel):
    code: str


class BingAdsCredentials(BaseModel):
    code: str
    state: str
    code_verifier: str


class LinkedinCredentials(BaseModel):
    code: str
    state: str


class SalesForceCredentials(BaseModel):
    code: str


class MetaCredentials(BaseModel):
    access_token: str


class SupperssionSet(BaseModel):
    suppression: bool


class S3Credentials(BaseModel):
    secret_key: str
    secret_id: str


class CustomerIoCredentials(BaseModel):
    api_key: str


class IntegrationCredentials(BaseModel):
    shopify: Optional[ShopifyOrBigcommerceCredentials] = None
    woocommerce: Optional[WoocommerceCredentials] = None
    bigcommerce: Optional[
        ShopifyOrBigcommerceCredentials | ExternalAppInstalled
    ] = None
    klaviyo: Optional[ApiKeyCredentials] = None
    mailchimp: Optional[ApiKeyCredentials] = None
    attentive: Optional[ApiKeyCredentials] = None
    meta: Optional[MetaCredentials] = None
    sendlane: Optional[ApiKeyCredentials] = None
    omnisend: Optional[ApiKeyCredentials] = None
    hubspot: Optional[HubSpotCredentials] = None
    google_ads: Optional[GoogleAdsCredentials] = None
    bing_ads: Optional[BingAdsCredentials] = None
    linkedin: Optional[LinkedinCredentials] = None
    go_high_level: Optional[GoHighLevelCredentials] = None
    s3: Optional[S3Credentials] = None
    sales_force: Optional[SalesForceCredentials] = None
    customer_io: Optional[CustomerIoCredentials] = None
    instantly: Optional[CustomerIoCredentials] = None

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
    is_constant: Optional[bool] = None


class Campaign(BaseModel):
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    campaign_objective: Optional[str] = None
    bid_amount: Optional[str] = None


class LeadsType(str, Enum):
    ALL_CONTACTS = "allContacts"
    CONVERTED_SALES = "converted_sales"
    VIEWED_PRODUCT = "viewed_product"
    VISITOR = "visitor"
    ABANDONED_CART = "abandoned_cart"


class SyncCreate(BaseModel):
    list_id: Optional[str] = None
    tags_id: Optional[str] = None
    customer_id: Optional[str] = None
    list_name: Optional[str] = None
    webhook_url: Optional[str] = None
    method: Optional[str] = None
    integrations_users_sync_id: Optional[int] = None
    leads_type: LeadsType = LeadsType.ALL_CONTACTS
    data_map: Optional[List[DataMap]] = None
    campaign: Optional[Campaign] = None


class SyncRequest(BaseModel):
    list_id: str


class SmartAudienceSyncCreate(BaseModel):
    smart_audience_id: UUID
    customer_id: Optional[str] = None
    list_id: Optional[str] = None
    campaign: Optional[Campaign] = None
    sent_contacts: int
    list_name: Optional[str] = None
    data_map: Optional[List[DataMap]] = None


class CreateCampaign(BaseModel):
    campaign_name: str
    bid_amount: Optional[str] = None
    daily_budget: Optional[str] = None
    ad_account_id: Optional[str] = None


class CreateListOrTags(BaseModel):
    name: str
    customer_id: Optional[str] = None
    webhook_url: Optional[str] = None
    method: Optional[str] = None
    sender_id: Optional[str] = None
    description: Optional[str] = None
    ad_account_id: Optional[str] = None


class ContactSuppression(BaseModel):
    id: str
    email: str
    phone_number: Optional[str] = None


class ContactFiled(Enum):
    id = "id"
    email = "email"
    phone_number = "phone_number"


class OrderAPI(BaseModel):
    platform_order_id: Optional[int] = None
    platform_user_id: Optional[int] = None
    platform_created_at: Optional[str] = None
    total_price: Optional[float] = None
    email: Optional[EmailStr] = None
    currency_code: Optional[str] = None


class ListFromIntegration(BaseModel):
    id: str
    list_name: str


class ReqestList(BaseModel):
    ad_account_id: Optional[str] = None
