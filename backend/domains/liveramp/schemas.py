from pydantic import BaseModel
from typing import Optional


class LiverampRow(BaseModel):
    ASID: str
    FirstName: Optional[str]
    LastName: Optional[str]
    BUSINESS_EMAIL: Optional[str]
    PERSONAL_EMAIL: Optional[str]
    PhoneMobile1: Optional[str]
    HomeCity: Optional[str]
    HomeState: Optional[str]
    Gender: Optional[str]
    Age: Optional[int]
    MaritalStatus: Optional[str]
    Pets: Optional[int]
    ChildrenPresent: Optional[int]
    Spend: Optional[str]
