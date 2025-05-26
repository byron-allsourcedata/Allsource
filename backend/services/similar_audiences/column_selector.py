from typing import (
    Dict,
    Any,
    List
)

from sqlalchemy import (
    cast,
    String
)

from models import (
    AudienceLookalikes,
    AudienceSourcesMatchedPerson,
    EnrichmentPersonalProfiles,
    EnrichmentFinancialRecord,
    EnrichmentLifestyle,
    EnrichmentVoterRecord,
    EnrichmentEmploymentHistory,
    EnrichmentProfessionalProfile
)
from resolver import injectable


@injectable
class AudienceColumnSelector:
    def __init__(self):
        pass

    def clickhouse_columns(
        self,
        significant_fields: dict
    ) -> List[str]:
        return self.column_names(significant_fields)

    def cols(
        self,
        audience_lookalike: AudienceLookalikes
    ):
        sig_fields = audience_lookalike.significant_fields or {}

        column_map = {
            "customer_value": (AudienceSourcesMatchedPerson.value_score.label(
                "customer_value"
            )),
            **self.get_enrichment_user_column_map()
        }

        selected_column_names = self.column_names(sig_fields)

        select_cols = (
            [column_map[name] for name in selected_column_names]
            + [column_map["customer_value"]]
        )

        return select_cols


    def column_names(
        self,
        significant_fields: dict
    ) -> List[str]:
        column_map = {
            "customer_value": (AudienceSourcesMatchedPerson.value_score.label(
                "customer_value"
            )),
            **self.get_enrichment_user_column_map()
        }
        selected_column_names = []
        for field in significant_fields:
            if field in column_map:
                selected_column_names.append(field)

        return selected_column_names


    def get_enrichment_user_column_map(
        self
    ) -> Dict[str, Any]:
        return {
            # — Personal Profiles —
            "age": EnrichmentPersonalProfiles.age.label(
                "age"
            ),
            "gender": EnrichmentPersonalProfiles.gender.label(
                "gender"
            ),
            "homeowner": EnrichmentPersonalProfiles.homeowner.label(
                "homeowner"
            ),
            "length_of_residence_years": EnrichmentPersonalProfiles.length_of_residence_years.label(
                "length_of_residence_years"
            ),
            "marital_status": EnrichmentPersonalProfiles.marital_status.label(
                "marital_status"
            ),
            "business_owner": EnrichmentPersonalProfiles.business_owner.label(
                "business_owner"
            ),
            "birth_day": EnrichmentPersonalProfiles.birth_day.label(
                "birth_day"
            ),
            "birth_month": EnrichmentPersonalProfiles.birth_month.label(
                "birth_month"
            ),
            "birth_year": EnrichmentPersonalProfiles.birth_year.label(
                "birth_year"
            ),
            "has_children": EnrichmentPersonalProfiles.has_children.label(
                "has_children"
            ),
            "number_of_children": EnrichmentPersonalProfiles.number_of_children.label(
                "number_of_children"
            ),
            "religion": EnrichmentPersonalProfiles.religion.label(
                "religion"
            ),
            "ethnicity": EnrichmentPersonalProfiles.ethnicity.label(
                "ethnicity"
            ),
            "language_code": EnrichmentPersonalProfiles.language_code.label(
                "language_code"
            ),
            "state_abbr": EnrichmentPersonalProfiles.state_abbr.label(
                "state_abbr"
            ),
            # "state": EnrichmentPersonalProfiles.state_abbr.label(
            #     "state"
            # ),
            "zip_code5": cast(
                EnrichmentPersonalProfiles.zip_code5,
                String
            ).label(
                "zip_code5"
            ),

            # — Financial Records —
            "income_range": EnrichmentFinancialRecord.income_range.label(
                "income_range"
            ),
            "net_worth": EnrichmentFinancialRecord.net_worth.label(
                "net_worth"
            ),
            "credit_rating": EnrichmentFinancialRecord.credit_rating.label(
                "credit_rating"
            ),
            "credit_cards": EnrichmentFinancialRecord.credit_cards.label(
                "credit_cards"
            ),
            "bank_card": EnrichmentFinancialRecord.bank_card.label(
                "bank_card"
            ),
            "credit_card_premium": EnrichmentFinancialRecord.credit_card_premium.label(
                "credit_card_premium"
            ),
            "credit_card_new_issue": EnrichmentFinancialRecord.credit_card_new_issue.label(
                "credit_card_new_issue"
            ),
            "credit_lines": EnrichmentFinancialRecord.credit_lines.label(
                "credit_lines"
            ),
            "credit_range_of_new_credit_lines": EnrichmentFinancialRecord.credit_range_of_new_credit_lines.label(
                "credit_range_of_new_credit_lines"
            ),
            "donor": EnrichmentFinancialRecord.donor.label(
                "donor"
            ),
            "investor": EnrichmentFinancialRecord.investor.label(
                "investor"
            ),
            "mail_order_donor": EnrichmentFinancialRecord.mail_order_donor.label(
                "mail_order_donor"
            ),

            # — Lifestyle —
            "pets": EnrichmentLifestyle.pets.label(
                "pets"
            ),
            "cooking_enthusiast": EnrichmentLifestyle.cooking_enthusiast.label(
                "cooking_enthusiast"
            ),
            "travel": EnrichmentLifestyle.travel.label(
                "travel"
            ),
            "mail_order_buyer": EnrichmentLifestyle.mail_order_buyer.label(
                "mail_order_buyer"
            ),
            "online_purchaser": EnrichmentLifestyle.online_purchaser.label(
                "online_purchaser"
            ),
            "book_reader": EnrichmentLifestyle.book_reader.label(
                "book_reader"
            ),
            "health_and_beauty": EnrichmentLifestyle.health_and_beauty.label(
                "health_and_beauty"
            ),
            "fitness": EnrichmentLifestyle.fitness.label(
                "fitness"
            ),
            "outdoor_enthusiast": EnrichmentLifestyle.outdoor_enthusiast.label(
                "outdoor_enthusiast"
            ),
            "tech_enthusiast": EnrichmentLifestyle.tech_enthusiast.label(
                "tech_enthusiast"
            ),
            "diy": EnrichmentLifestyle.diy.label(
                "diy"
            ),
            "gardening": EnrichmentLifestyle.gardening.label(
                "gardening"
            ),
            "automotive_buff": EnrichmentLifestyle.automotive_buff.label(
                "automotive_buff"
            ),
            "golf_enthusiasts": EnrichmentLifestyle.golf_enthusiasts.label(
                "golf_enthusiasts"
            ),
            "beauty_cosmetics": EnrichmentLifestyle.beauty_cosmetics.label(
                "beauty_cosmetics"
            ),
            "smoker": EnrichmentLifestyle.smoker.label(
                "smoker"
            ),

            # — Voter Record —
            "party_affiliation": EnrichmentVoterRecord.party_affiliation.label(
                "party_affiliation"
            ),
            "congressional_district": EnrichmentVoterRecord.congressional_district.label(
                "congressional_district"
            ),
            "voting_propensity": EnrichmentVoterRecord.voting_propensity.label(
                "voting_propensity"
            ),

            # — Employment History —
            "job_title": EnrichmentEmploymentHistory.job_title.label(
                "job_title"
            ),
            "company_name": EnrichmentEmploymentHistory.company_name.label(
                "company_name"
            ),
            "start_date": EnrichmentEmploymentHistory.start_date.label(
                "start_date"
            ),
            "end_date": EnrichmentEmploymentHistory.end_date.label(
                "end_date"
            ),
            "is_current": EnrichmentEmploymentHistory.is_current.label(
                "is_current"
            ),
            "location": EnrichmentEmploymentHistory.location.label(
                "location"
            ),
            "job_description": EnrichmentEmploymentHistory.job_description.label(
                "job_description"
            ),

            # — Professional Profile —
            "current_job_title": EnrichmentProfessionalProfile.current_job_title.label(
                "current_job_title"
            ),
            "current_company_name": EnrichmentProfessionalProfile.current_company_name.label(
                "current_company_name"
            ),
            "job_start_date": EnrichmentProfessionalProfile.job_start_date.label(
                "job_start_date"
            ),
            "job_duration": EnrichmentProfessionalProfile.job_duration.label(
                "job_duration"
            ),
            "job_location": EnrichmentProfessionalProfile.job_location.label(
                "job_location"
            ),
            "job_level": EnrichmentProfessionalProfile.job_level.label(
                "job_level"
            ),
            "department": EnrichmentProfessionalProfile.department.label(
                "department"
            ),
            "company_size": EnrichmentProfessionalProfile.company_size.label(
                "company_size"
            ),
            "primary_industry": EnrichmentProfessionalProfile.primary_industry.label(
                "primary_industry"
            ),
            "annual_sales": EnrichmentProfessionalProfile.annual_sales.label(
                "annual_sales"
            ),
        }
