from pydantic import BaseModel, EmailStr
import typing as tp
    
class SalesForceProfile(BaseModel):
    FirstName: tp.Optional[str] = None
    LastName: tp.Optional[str] = None
    Email: tp.Optional[EmailStr] = None
    Phone: tp.Optional[str] = None
    MobilePhone: tp.Optional[str] = None
    Company: tp.Optional[str] = None
    Title: tp.Optional[str] = None
    Industry: tp.Optional[str] = None
    LeadSource: tp.Optional[str] = None
    Street: tp.Optional[str] = None
    City: tp.Optional[str] = None
    State: tp.Optional[str] = None
    Country: tp.Optional[str] = None
    NumberOfEmployees: tp.Optional[str] = None
    AnnualRevenue: tp.Optional[str] = None
    Description: tp.Optional[str] = None
    