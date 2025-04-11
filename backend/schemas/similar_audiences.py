from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

class AudienceData(BaseModel):
    EmailAddress: Optional[str]
    PersonExactAge: Optional[str]
    PersonGender: Optional[str]
    EstimatedHouseholdIncomeCode: Optional[str]
    EstimatedCurrentHomeValueCode: Optional[str]
    HomeownerStatus: Optional[str]
    HasChildren: Optional[str]
    NumberOfChildren: Optional[str]
    CreditRating: Optional[str]
    NetWorthCode: Optional[str]
    ZipCode5: Optional[str]
    Latitude: Optional[str]
    Longitude: Optional[str]
    HasCreditCard: Optional[str]
    LengthOfResidenceYears: Optional[str]
    MaritalStatus: Optional[str]
    OccupationGroupCode: Optional[str]
    IsBookReader: Optional[str]
    IsOnlinePurchaser: Optional[str]
    StateAbbr: Optional[str]
    IsTraveler: Optional[str]
    customer_value: Decimal


class AudienceFeatureImportance(BaseModel):
    PersonExactAge: float
    PersonGender: float
    EstimatedHouseholdIncomeCode: float
    EstimatedCurrentHomeValueCode: float
    HomeownerStatus: float
    HasChildren: float
    NumberOfChildren: float
    CreditRating: float
    NetWorthCode: float
    HasCreditCard: float
    LengthOfResidenceYears: float
    MaritalStatus: float
    OccupationGroupCode: float
    IsBookReader: float
    IsOnlinePurchaser: float
    IsTraveler: float
    ZipCode5: float
    ZipCode4: float
    ZipCode3: float
    state_name: float
    state_city: float