from typing import Optional
from uuid import UUID

from db_dependencies import Db
from models import EnrichmentUserContact, EnrichmentPostal, EnrichmentPersonalProfiles, EnrichmentProfessionalProfile
from resolver import injectable
from pydantic import BaseModel
from services.integrations.commonIntegration import (
    UserContacts,
    User,
    UserPostalInfo,
    PersonalProfiles,
    ProfessionalProfile,
)


class IntegrationContext(BaseModel):
    main_phone: Optional[EnrichmentPostal]
    professional_profiles: Optional[EnrichmentProfessionalProfile]
    postal: Optional[EnrichmentPostal]
    personal_profiles: Optional[EnrichmentPersonalProfiles]
    business_email: Optional[str]
    personal_email: Optional[str]
    country_code: Optional[EnrichmentPostal]
    gender: Optional[EnrichmentPersonalProfiles]
    zip_code: Optional[EnrichmentPersonalProfiles]
    state: Optional[EnrichmentPostal]
    city: Optional[EnrichmentPostal]
    company: Optional[EnrichmentProfessionalProfile]
    business_email_last_seen_date: Optional[EnrichmentUserContact]
    personal_email_last_seen: Optional[EnrichmentUserContact]
    linkedin_url: Optional[EnrichmentUserContact]


@injectable
class CommonIntegrationPersistence:
    def __init__(
        self,
        db: Db
    ):
        self.db = db

    def get_contacts_by_user(self, asid: UUID) -> Optional[EnrichmentUserContact]:
        return (
            self.db
            .query(EnrichmentUserContact)
            .filter_by(asid=asid)
            .one_or_none()
        )

    def get_postal_by_user(self, asid: UUID) -> Optional[EnrichmentPostal]:
        return (
            self.db
            .query(EnrichmentPostal)
            .filter_by(asid=asid)
            .one_or_none()
        )

    def get_personal_profiles_by_user(self, asid: UUID) -> Optional[EnrichmentPersonalProfiles]:
        return (
            self.db
            .query(EnrichmentPersonalProfiles)
            .filter_by(asid=asid)
            .one_or_none()
        )

    def get_professional_profiles_by_user(self, asid: UUID) -> Optional[EnrichmentProfessionalProfile]:
        return (
            self.db
            .query(EnrichmentProfessionalProfile)
            .filter_by(asid=asid)
            .one_or_none()
        )

    def get_user_data(self, user_asid: UUID) -> User:
        contact_model = self.get_contacts_by_user(user_asid)
        postal_model = self.get_postal_by_user(user_asid)
        personal_model = self.get_personal_profiles_by_user(user_asid)
        professional_model = self.get_professional_profiles_by_user(user_asid)

        contacts = (
            UserContacts.from_orm(contact_model)
            if contact_model else None
        )

        postal = (
            UserPostalInfo.from_orm(postal_model)
            if postal_model else None
        )

        personal_profiles: Optional[PersonalProfiles] = (
            PersonalProfiles.from_orm(personal_model)
            if personal_model else None
        )

        professional_profiles: Optional[ProfessionalProfile] = (
            ProfessionalProfile.from_orm(professional_model)
            if professional_model else None
        )

        return User(
            contacts=contacts,
            postal=postal,
            personal_profiles=personal_profiles,
            professional_profiles=professional_profiles,
        )

    def build_integration_context(
        self,
        enrichment_user: User,
        main_phone: Optional[str] = None,
        business_email: Optional[str] = None,
        personal_email: Optional[str] = None,
    ) -> IntegrationContext:
        contacts = enrichment_user.contacts
        postal = enrichment_user.postal
        pers_prof = enrichment_user.personal_profiles
        prof_prof = enrichment_user.professional_profiles

        return IntegrationContext(
            main_phone=main_phone,
            professional_profiles=prof_prof,
            postal=postal,
            personal_profiles=pers_prof,
            business_email=business_email,
            personal_email=personal_email,

            country_code=postal,
            state=postal,
            city=postal,

            gender=pers_prof,
            zip_code=pers_prof,

            company=prof_prof,

            business_email_last_seen_date=contacts,
            personal_email_last_seen=contacts,
            linkedin_url=contacts,
        )
