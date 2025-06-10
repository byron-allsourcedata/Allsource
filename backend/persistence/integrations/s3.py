from typing import Optional, TypedDict
from uuid import UUID

from pydantic import BaseModel

from db_dependencies import Db
from resolver import injectable
from services.integrations.commonIntegration import UserContacts, UserPostalInfo


class ProfessionalProfile(BaseModel):
    current_company_name: Optional[str]


class PersonalProfiles(BaseModel):
    zip_code5: Optional[str]
    gender: Optional[str]


class User(BaseModel):
    contacts: Optional[UserContacts]
    postal: Optional[UserPostalInfo]
    personal_profiles: Optional[PersonalProfiles]
    professional_profiles: Optional[ProfessionalProfile]


@injectable
class S3IntegrationPersistence:
    def __init__(
        self,
        db: Db
    ):
        self.db = db

    def get_user_data(
        self,
        user_id: UUID
    ) -> User:
        #TODO
        return User(
            contacts=None,
            postal=None,
            personal_profiles=None,
            professional_profiles=None
        )
