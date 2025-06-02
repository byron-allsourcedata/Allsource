from __future__ import annotations

from enum import Enum
from typing import List

from pydantic import BaseModel


class HubspotLeadStatus(str, Enum):
    NOT_VERIFIED = "NOT_VERIFIED"
    NEW = "NEW"


class NewContactCRM(BaseModel):
    email: str
    firstname: str
    lastname: str
    hs_lead_status: HubspotLeadStatus = HubspotLeadStatus.NOT_VERIFIED

    class Config:
        use_enum_values = True


class NewContactRequest(BaseModel):
    associations: List[Association]
    properties: NewContactCRM


class UpdateContactStatusRequest(BaseModel):
    properties: NewContactStatus

    @classmethod
    def new(
        cls,
        status: HubspotLeadStatus
    ):
        return cls(properties=NewContactStatus(hs_lead_status=status))


class NewContactStatus(BaseModel):
    hs_lead_status: HubspotLeadStatus


Association = dict
