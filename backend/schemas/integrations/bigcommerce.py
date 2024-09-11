from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class BigCommerceUserScheme(BaseModel):
    authentication_force_password_reset: bool
    company: Optional[str] = None
    customer_group_id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    notes: Optional[str] = None
    phone: Optional[str] = None
    registration_ip_address: Optional[str] = None
    tax_exempt_category: Optional[str] = None
    date_modified: datetime
    accepts_product_review_abandoned_cart_emails: bool
    origin_channel_id: Optional[int] = None
    channel_ids: Optional[str] = None
