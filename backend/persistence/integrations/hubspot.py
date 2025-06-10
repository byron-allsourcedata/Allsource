from typing import Optional
from uuid import UUID

from db_dependencies import Db
from models import (
    EnrichmentUserContact, EnrichmentPostal, EnrichmentPersonalProfiles, EnrichmentProfessionalProfile,
    EnrichmentUser,
)
from resolver import injectable
from services.integrations.commonIntegration import (
    UserContacts, UserPostalInfo, User, PersonalProfiles,
    ProfessionalProfile,
)


@injectable
class HubspotPersistence:
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
