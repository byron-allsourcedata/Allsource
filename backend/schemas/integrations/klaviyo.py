from pydantic import BaseModel, EmailStr
import typing as tp
from datetime import datetime

class KlaviyoCustomer(BaseModel):
    klaviyo_user_id: str
    email: EmailStr
    first_name: tp.Optional[str] = None
    last_name: tp.Optional[str] = None
    phone_number: tp.Optional[str] = None
    ip: tp.Optional[str] = None 
    organization: tp.Optional[str] = None
    updated_at: tp.Any
    external_id: tp.Optional[str] = None
    anonymous_id: tp.Optional[str] = None
    city: tp.Optional[str] = None
    zip: tp.Optional[str] = None
    timezone: tp.Optional[str] = None

class KlaviyoList(BaseModel):
    id: str
    list_name: str

class KlaviyoTags(BaseModel):
    id: str
    tag_name: str

class KlaviyoSync(BaseModel):
    list_id: int
    supression: bool
    filter_contact_type: tp.List[str]
    map_data: tp.Dict[str, str]

class KlaviyoLocation(BaseModel):
    address1: tp.Optional[str] = None
    address2: tp.Optional[str] = None
    city: tp.Optional[str] = None
    contry: tp.Optional[str] = None
    latitude: tp.Optional[str | int] = None
    longitude: tp.Optional[str | int] = None
    region: tp.Optional[str] = None
    zip: tp.Optional[str] = None
    timezone: tp.Optional[str] = None
    ip: tp.Optional[str] = None

class KlaviyoProfile(BaseModel):
    email: EmailStr
    phone_number: str
    first_name: tp.Optional[str] = None
    last_name: tp.Optional[str] = None
    organization: tp.Optional[str] = None
    title: tp.Optional[str] = None
    location: tp.Optional[KlaviyoLocation] = None
    properties: tp.Optional[tp.Dict[str, tp.Any]]