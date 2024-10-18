from pydantic import BaseModel, EmailStr
import typing as tp
from datetime import datetime


class OmnisendProfile(BaseModel):
    address: tp.Optional[str] = None
    birthdate: tp.Optional[str] = None
    city: tp.Optional[str] = None
    country: tp.Optional[str] = None
    countryCode: tp.Optional[str] = None
    firstName: tp.Optional[str] = None
    gender: tp.Optional[str] = None
    lastName: tp.Optional[str] = None
    postalCode: tp.Optional[str] = None
    state: tp.Optional[str] = None

class Identifiers(BaseModel):
    """
    ID - Email lead
    """
    channels: tp.Any = { "email": { "status": "subscribed" } }
    type: str = 'email'
    id: EmailStr



    