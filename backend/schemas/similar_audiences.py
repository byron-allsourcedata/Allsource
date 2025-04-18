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
    PersonExactAge: Optional[float] = None
    PersonGender: Optional[float] = None
    EstimatedHouseholdIncomeCode: Optional[float] = None
    EstimatedCurrentHomeValueCode: Optional[float] = None
    HomeownerStatus: Optional[float] = None
    HasChildren: Optional[float] = None
    NumberOfChildren: Optional[float] = None
    CreditRating: Optional[float] = None
    NetWorthCode: Optional[float] = None
    HasCreditCard: Optional[float] = None
    LengthOfResidenceYears: Optional[float] = None
    MaritalStatus: Optional[float] = None
    OccupationGroupCode: Optional[float] = None
    IsBookReader: Optional[float] = None
    IsOnlinePurchaser: Optional[float] = None
    IsTraveler: Optional[float] = None
    ZipCode5: Optional[float] = None
    ZipCode4: Optional[float] = None
    ZipCode3: Optional[float] = None
    state_name: Optional[float] = None
    state_city: Optional[float] = None

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