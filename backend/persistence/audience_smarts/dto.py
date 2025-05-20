from datetime import datetime
from typing import Optional, Dict
from uuid import UUID

from pydantic import BaseModel


class AudienceSmartDTO(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime
    user_id: Optional[int]
    created_by_user_id: Optional[int]
    total_records: int
    validated_records: int
    active_segment_records: int
    processed_active_segment_records: int
    status: str
    use_case_id: Optional[UUID]
    validations: Optional[Dict]
    target_schema: Optional[str]

    class Config:
        orm_mode = True

class PersonRecord(BaseModel):
    # enrichment_users_contacts
    id:                                Optional[UUID] = None
    asid:                              Optional[UUID] = None
    up_id:                             Optional[str]  = None
    rsid:                              Optional[str]  = None
    name_prefix:                       Optional[str]  = None
    first_name:                        Optional[str]  = None
    middle_name:                       Optional[str]  = None
    last_name:                         Optional[str]  = None
    name_suffix:                       Optional[str]  = None
    business_email:                    Optional[str]  = None
    personal_email:                    Optional[str]  = None
    other_emails:                      Optional[str]  = None
    phone_mobile1:                     Optional[str]  = None
    phone_mobile2:                     Optional[str]  = None
    business_email_last_seen_date:     Optional[datetime] = None
    personal_email_last_seen:          Optional[datetime] = None
    mobile_phone_dnc:                  Optional[bool] = None
    business_email_validation_status:  Optional[str]  = None
    personal_email_validation_status:  Optional[str]  = None
    linkedin_url:                      Optional[str]  = None
    email:                             Optional[str]  = None

    # enrichment_personal_profiles
    age:                        Optional[str] = None
    gender:                     Optional[str] = None
    homeowner:                  Optional[str] = None
    length_of_residence_years:  Optional[int] = None
    marital_status:             Optional[str] = None
    business_owner:             Optional[int] = None
    birth_day:                  Optional[int] = None
    birth_month:                Optional[int] = None
    birth_year:                 Optional[int] = None
    has_children:               Optional[int] = None
    number_of_children:         Optional[int] = None
    religion:                   Optional[str] = None
    ethnicity:                  Optional[str] = None
    language_code:              Optional[str] = None
    state_abbr:                 Optional[str] = None
    zip_code5:                  Optional[str] = None

    class Config:
        orm_mode = True


class SyncedPersonRecord(BaseModel):
    # enrichment_users_contacts
    id:                                Optional[UUID] = None
    asid:                              Optional[UUID] = None
    up_id:                             Optional[str]  = None
    rsid:                              Optional[str]  = None
    name_prefix:                       Optional[str]  = None
    first_name:                        Optional[str]  = None
    middle_name:                       Optional[str]  = None
    last_name:                         Optional[str]  = None
    name_suffix:                       Optional[str]  = None
    business_email:                    Optional[str]  = None
    personal_email:                    Optional[str]  = None
    other_emails:                      Optional[str]  = None
    phone_mobile1:                     Optional[str]  = None
    phone_mobile2:                     Optional[str]  = None
    business_email_last_seen_date:     Optional[datetime] = None
    personal_email_last_seen:          Optional[datetime] = None
    mobile_phone_dnc:                  Optional[bool] = None
    business_email_validation_status:  Optional[str]  = None
    personal_email_validation_status:  Optional[str]  = None
    linkedin_url:                      Optional[str]  = None
    email:                             Optional[str]  = None

    # state
    state:  Optional[str] = None
    gender: Optional[str] = None

    class Config:
        orm_mode = True