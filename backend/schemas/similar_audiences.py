from pydantic import BaseModel
from typing import Optional, Callable, Dict, List
from decimal import Decimal

class AudienceData(BaseModel):
    EmailAddress: Optional[str] = None
    PersonExactAge: Optional[str] = None
    PersonGender: Optional[str] = None
    EstimatedHouseholdIncomeCode: Optional[str] = None
    EstimatedCurrentHomeValueCode: Optional[str] = None
    HomeownerStatus: Optional[str] = None
    HasChildren: Optional[str] = None
    NumberOfChildren: Optional[str] = None
    CreditRating: Optional[str] = None
    NetWorthCode: Optional[str] = None
    ZipCode5: Optional[str] = None
    Latitude: Optional[str] = None
    Longitude: Optional[str] = None
    HasCreditCard: Optional[str] = None
    LengthOfResidenceYears: Optional[str] = None
    MaritalStatus: Optional[str] = None
    OccupationGroupCode: Optional[str] = None
    IsBookReader: Optional[str] = None
    IsOnlinePurchaser: Optional[str] = None
    StateAbbr: Optional[str] = None
    IsTraveler: Optional[str] = None
    customer_value: Decimal

class AudienceFeatureImportance(BaseModel):
    PersonExactAge: Optional[float] = 0
    PersonGender: Optional[float] = 0
    EstimatedHouseholdIncomeCode: Optional[float] = 0
    EstimatedCurrentHomeValueCode: Optional[float] = 0
    HomeownerStatus: Optional[float] = 0
    HasChildren: Optional[float] = 0
    NumberOfChildren: Optional[float] = 0
    CreditRating: Optional[float] = 0
    NetWorthCode: Optional[float] = 0
    HasCreditCard: Optional[float] = 0
    LengthOfResidenceYears: Optional[float] = 0
    MaritalStatus: Optional[float] = 0
    OccupationGroupCode: Optional[float] = 0
    IsBookReader: Optional[float] = 0
    IsOnlinePurchaser: Optional[float] = 0
    IsTraveler: Optional[float] = 0
    ZipCode5: Optional[float] = 0
    ZipCode4: Optional[float] = 0
    ZipCode3: Optional[float] = 0
    state_name: Optional[float] = 0
    state_city: Optional[float] = 0

OrderedFeatureRules = Dict[str, Callable[[str], int | None]]

class NormalizationConfig(BaseModel):
    """
        numerical features: Age, NumberOfChildren
        unordered features: ZipCode, Gender, HasChildren, IsBookReader
        ordered features: IncomeCode, Credit Rating

        ordered features require mapping to int
    """
    numerical_features: List[str]
    unordered_features: List[str]
    ordered_features: OrderedFeatureRules