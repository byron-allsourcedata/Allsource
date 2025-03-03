import typing as tp
from pydantic import BaseModel


class HubspotProfile(BaseModel):
    email:  tp.Optional[str] = None
    firstname: tp.Optional[str] = None
    lastname: tp.Optional[str] = None
    phone: tp.Optional[str] = None
    company: tp.Optional[str] = None
    website: tp.Optional[str] = None
    lifecyclestage: tp.Optional[str] = None
    jobtitle: tp.Optional[str] = None
    industry: tp.Optional[str] = None
    annualrevenue: tp.Optional[str] = None
    twitterhandle: tp.Optional[str] = None
    linkedinbio: tp.Optional[str] = None
    address: tp.Optional[str] = None
    city: tp.Optional[str] = None
    state: tp.Optional[str] = None
    zip: tp.Optional[str] = None
    gender: tp.Optional[str] = None

