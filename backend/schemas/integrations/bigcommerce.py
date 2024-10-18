from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime

class BigCommerceInfo(BaseModel):
    id: str
    account_uuid: str
    domain: str
    secure_url: str
    control_panel_base_url: str
    admin_email: str
    order_email: str

class BigCommerceOrderAPI(BaseModel):
    bigceoid: Optional[int] = None
    bigcommerce_user_id: Optional[str] = None
    bigcommerce_created_at: Optional[str] = None
    total_price: Optional[float] = None
    email: Optional[EmailStr] = None
    currency_code: Optional[str] = None

