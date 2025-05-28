from typing import List
from uuid import UUID

from db_dependencies import Db
from models import (
    EnrichmentEmploymentHistory, EnrichmentVoterRecord, EnrichmentPersonalProfiles,
    EnrichmentFinancialRecord, EnrichmentLifestyle, EnrichmentProfessionalProfile, EnrichmentUser
)
from resolver import injectable


@injectable
class EnrichmentPostgresPersistence:
    def __init__(
        self,
        db: Db
    ):
        self.db = db

    def personal(
        self,
        asids: List[UUID]
    ):
        return (
            self.db.query(
                EnrichmentPersonalProfiles.gender,
                EnrichmentPersonalProfiles.state_abbr,
                EnrichmentPersonalProfiles.religion,
                EnrichmentPersonalProfiles.homeowner,
                EnrichmentPersonalProfiles.age,
                EnrichmentPersonalProfiles.ethnicity,
                EnrichmentPersonalProfiles.language_code,
                EnrichmentPersonalProfiles.marital_status,
                EnrichmentPersonalProfiles.has_children,
            )
            .filter(EnrichmentPersonalProfiles.asid.in_(asids))
            .all()
        )

    def financial(
        self,
        asids: List[UUID]
    ):
        return (
            self.db.query(
                EnrichmentFinancialRecord.income_range,
                EnrichmentFinancialRecord.net_worth,
                EnrichmentFinancialRecord.credit_rating,
                EnrichmentFinancialRecord.credit_cards,
                EnrichmentFinancialRecord.bank_card,
                EnrichmentFinancialRecord.credit_card_premium,
                EnrichmentFinancialRecord.credit_card_new_issue,
                EnrichmentFinancialRecord.credit_lines,
                EnrichmentFinancialRecord.credit_range_of_new_credit_lines,
                EnrichmentFinancialRecord.donor,
                EnrichmentFinancialRecord.investor,
                EnrichmentFinancialRecord.mail_order_donor,
            ).filter(
                EnrichmentFinancialRecord.asid.in_(asids)
            ).all()
        )

    def lifestyles(
        self,
        asids: List[UUID]
    ):
        rows = (
            self.db.query(
                EnrichmentLifestyle.pets,
                EnrichmentLifestyle.cooking_enthusiast,
                EnrichmentLifestyle.travel,
                EnrichmentLifestyle.mail_order_buyer,
                EnrichmentLifestyle.online_purchaser,
                EnrichmentLifestyle.book_reader,
                EnrichmentLifestyle.health_and_beauty,
                EnrichmentLifestyle.fitness,
                EnrichmentLifestyle.outdoor_enthusiast,
                EnrichmentLifestyle.tech_enthusiast,
                EnrichmentLifestyle.diy,
                EnrichmentLifestyle.automotive_buff,
                EnrichmentLifestyle.smoker,
                EnrichmentLifestyle.golf_enthusiasts,
                EnrichmentLifestyle.beauty_cosmetics,
            ).filter(
                EnrichmentLifestyle.asid.in_(asids)
            ).all()
        )
        return rows

    def voter(
        self,
        asids: List[UUID]
    ):
        return self.db.query(
            EnrichmentVoterRecord.congressional_district,
            EnrichmentVoterRecord.voting_propensity,
            EnrichmentVoterRecord.party_affiliation,
        ).filter(
            EnrichmentVoterRecord.asid.in_(asids)
        ).all()

    def query_employment(
        self,
        asids: List[UUID]
    ):
        return self.db.query(
            EnrichmentEmploymentHistory.job_title,
            EnrichmentEmploymentHistory.company_name,
            EnrichmentEmploymentHistory.start_date,
            EnrichmentEmploymentHistory.end_date,
            EnrichmentEmploymentHistory.is_current,
            EnrichmentEmploymentHistory.location,
            EnrichmentEmploymentHistory.job_description,
        ).filter(
            EnrichmentEmploymentHistory.asid.in_(asids)
        ).all()

    def professional(
        self,
        asids: List[UUID]
    ):
        return self.db.query(
            EnrichmentProfessionalProfile.current_job_title,
            EnrichmentProfessionalProfile.current_company_name,
            EnrichmentProfessionalProfile.job_start_date,
            EnrichmentProfessionalProfile.job_duration,
            EnrichmentProfessionalProfile.job_location,
            EnrichmentProfessionalProfile.job_level,
            EnrichmentProfessionalProfile.department,
            EnrichmentProfessionalProfile.company_size,
            EnrichmentProfessionalProfile.primary_industry,
            EnrichmentProfessionalProfile.annual_sales,
        ).filter(
            EnrichmentProfessionalProfile.asid.in_(asids)
        ).all()

    def employment(
        self,
        asids: List[UUID]
        ):
        return self.db.query(
            EnrichmentEmploymentHistory.job_title,
            EnrichmentEmploymentHistory.company_name,
            EnrichmentEmploymentHistory.start_date,
            EnrichmentEmploymentHistory.end_date,
            EnrichmentEmploymentHistory.is_current,
            EnrichmentEmploymentHistory.location,
            EnrichmentEmploymentHistory.job_description,
        ).filter(
            EnrichmentEmploymentHistory.asid.in_(asids)
        ).all()


    def users(self, user_ids: List[UUID]):
        return (
            self.db
            .query(EnrichmentUser.asid)
            .filter(EnrichmentUser.id.in_(user_ids))
            .all()
        )
