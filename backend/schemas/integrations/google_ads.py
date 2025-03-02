from pydantic import BaseModel, EmailStr
from typing import List, Optional
import typing as tp

class GoogleAdsProfile(BaseModel):
    email: tp.Optional[EmailStr] = None
    first_name: tp.Optional[str] = None
    last_name: tp.Optional[str] = None
    phone: tp.Optional[str] = None
    city: tp.Optional[str] = None
    state: tp.Optional[str] = None
    address: tp.Optional[str] = None