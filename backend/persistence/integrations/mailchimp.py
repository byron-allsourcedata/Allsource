from typing import Optional, TypedDict
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select

from db_dependencies import Db
from models import (
    EnrichmentUser, EnrichmentPostal, EnrichmentProfessionalProfile, EnrichmentPersonalProfiles,
    EnrichmentUserContact
)
from resolver import injectable




class MailchimpPostalData(BaseModel):
    pass




class MailchimpContactData(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    business_email: Optional[str]
    personal_email: Optional[str]
    other_emails: Optional[str]
    phone_mobile1: Optional[str]
    phone_mobile2: Optional[str]


class MailchimpPersonalProfileData(BaseModel):
    pass


class MailchimpProfessionalProfileData(BaseModel):
    pass


class MailchimpUserData(BaseModel):
    user_id: UUID
    postal: Optional[MailchimpPostalData]
    contacts: Optional[MailchimpContactData]
    personal_profiles: Optional[MailchimpPersonalProfileData]
    professional_profiles: Optional[MailchimpProfessionalProfileData]

class IntegrationContext(BaseModel):
    main_phone: Optional[MailchimpPostalData]
    professional_profiles: Optional[MailchimpProfessionalProfileData]
    postal: Optional[MailchimpPostalData]
    personal_profiles: Optional[MailchimpPersonalProfileData]
    business_email: Optional[str]
    personal_email: Optional[str]
    country_code: Optional[MailchimpPostalData]
    gender: Optional[MailchimpPersonalProfileData]
    zip_code: Optional[MailchimpPersonalProfileData]
    state: Optional[MailchimpPostalData]
    city: Optional[MailchimpPostalData]
    company: Optional[MailchimpProfessionalProfileData]
    business_email_last_seen_date: Optional[MailchimpContactData]
    personal_email_last_seen: Optional[MailchimpContactData]
    linkedin_url: Optional[MailchimpContactData]


@injectable
class MailchimpIntegrationPersistence:
    def __init__(
        self,
        db: Db
    ):
        self.db = db

    def get_user_data(
        self,
        user_id: UUID
    ) -> MailchimpUserData:
        user: EnrichmentUser = self.db.execute(
            select(
                EnrichmentUser
            ).where(EnrichmentUser.id == user_id)
        ).one()

        postal: Optional[EnrichmentPostal] = self.db.execute(
            select(
                EnrichmentProfessionalProfile
            )
            .where(EnrichmentProfessionalProfile.asid == user.asid)
        ).first()

        professional_profiles: Optional[EnrichmentProfessionalProfile] = self.db.execute(
            select(
                EnrichmentProfessionalProfile
            )
            .where(EnrichmentProfessionalProfile.asid == user.asid)
        ).first()

        personal_profiles: Optional[EnrichmentPersonalProfiles] = self.db.execute(
            select(
                EnrichmentPersonalProfiles
            )
            .where(EnrichmentPersonalProfiles.asid == user.asid)
        ).first()

        contacts: Optional[EnrichmentUserContact] = self.db.execute(
            select(
                EnrichmentUserContact
            )
            .where(EnrichmentUserContact.asid == user.asid)
        ).first()

        return MailchimpUserData(
            user_id=user_id,
            postal=postal,
            professional_profiles=professional_profiles,
            personal_profiles=personal_profiles,
            contacts=contacts
        )


    def get_integration_context(
        self,
        user_data: MailchimpUserData,
        main_phone: Optional[str],
        business_email: Optional[str],
        personal_email: Optional[str],
    ) -> IntegrationContext:
        return IntegrationContext(
            main_phone=main_phone,
            professional_profiles=user_data.professional_profiles,
            postal=user_data.postal,
            personal_profiles=user_data.personal_profiles,
            business_email=business_email,
            personal_email=personal_email,
            country_code=user_data.postal,
            gender=user_data.personal_profiles,
            zip_code=user_data.personal_profiles,
            state=user_data.postal,
            city=user_data.postal,
            company=user_data.professional_profiles,
            business_email_last_seen_date=user_data.contacts,
            personal_email_last_seen=user_data.contacts,
            linkedin_url=user_data.contacts
        )


    def get_integration_data(self):
        pass
        # result_map = {}
        # for field_type in required_types:
        #     filler = FIELD_FILLERS.get(field_type)
        #     if filler:
        #         filler(result_map, context)