from pydantic import BaseModel, EmailStr
import typing as tp

class GoogleAdsProfile(BaseModel):
    email: tp.Optional[EmailStr] = None
    first_name: tp.Optional[str] = None
    last_name: tp.Optional[str] = None
    phone: tp.Optional[str] = None
    gender: tp.Optional[str] = None
    url_visited: tp.Optional[str] = None
    behavior_type: tp.Optional[str] = None
    location: tp.Optional[str] = None