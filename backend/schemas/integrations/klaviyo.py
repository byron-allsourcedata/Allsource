from pydantic import BaseModel, EmailStr
import typing as tp

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



class KlaviyoProfile(BaseModel):
    email: tp.Optional[EmailStr] = None
    phone_number: tp.Optional[str] = None
    first_name: tp.Optional[str] = None
    last_name: tp.Optional[str] = None
    organization: tp.Optional[str] = None
    title: tp.Optional[str] = None
    location: tp.Optional[tp.Any] = None
    