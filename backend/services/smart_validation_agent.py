from decimal import Decimal
import json
import logging
from uuid import UUID

from persistence.audience_smarts import AudienceSmartsPersistence
from resolver import injectable
from services.validation_stats_service import ValidationStatsService

logger = logging.getLogger(__name__)


@injectable
class SmartValidationAgent:
    COLUMN_MAPPING = {
        "personal_email_validation_status": "mx",
        "business_email_validation_status": "mx",
        "personal_email_last_seen": "recency",
        "business_email_last_seen_date": "recency",
        "mobile_phone_dnc": "dnc_filter",
        "cas_home_address": "cas_home_address",
        "cas_office_address": "cas_office_address",
        "personal_email": "delivery",
        "business_email": "delivery",
        "job_validation": "job_validation",
        "confirmation": "confirmation",
    }

    CATEGORY_BY_COLUMN = {
        "personal_email_validation_status": "personal_email",
        "business_email_validation_status": "business_email",
        "personal_email_last_seen": "personal_email",
        "business_email_last_seen_date": "business_email",
        "mobile_phone_dnc": "phone",
        "personal_email": "personal_email",
        "business_email": "business_email",
    }

    def __init__(
        self,
        audience_smarts_persistence: AudienceSmartsPersistence,
        validation_stats: ValidationStatsService,
    ):
        self.audience_smarts_persistence = audience_smarts_persistence
        self.validation_stats = validation_stats

    def get_validation_temp_counts(self, smart_audience_id: UUID):
        return self.audience_smarts_persistence.get_validation_temp_counts(
            smart_audience_id=smart_audience_id
        )

    def update_failed_persons(self, failed_ids: list[UUID]):
        return self.audience_smarts_persistence.update_failed_persons(
            failed_ids=failed_ids
        )

    def update_success_persons(self, failed_ids: list[UUID]):
        return self.audience_smarts_persistence.update_success_persons(
            failed_ids=failed_ids
        )

    def _update_rule(
        self,
        rule,
        total_valid,
        count_persons_before_validation,
        count_subtracted,
        count_processed,
        total_count,
    ):
        rule.setdefault("count_cost", "0.00")
        rule["count_validated"] = total_valid
        rule["count_submited"] = count_persons_before_validation

        previous_cost = Decimal(rule["count_cost"])
        rule["count_cost"] = str(
            (previous_cost + count_subtracted).quantize(Decimal("0.01"))
        )

        if count_processed == total_count:
            rule["processed"] = True

    def update_step_processed(
        self, aud_smart_id: int, validation_type: str, batch_size: int
    ):
        self.validation_stats.update_step_processed(
            aud_smart_id, validation_type, batch_size
        )

    def update_validations_json(
        self,
        aud_smart_id: UUID,
        validation_type: str,
        total_valid: int,
        total_count: int,
        count_processed: int,
        count_persons_before_validation: int,
        count_subtracted: Decimal,
    ):
        validations = self.audience_smarts_persistence.get_audience_smart_validations_by_id(
            aud_smart_id
        )
        validations = json.loads(validations)

        key = self.COLUMN_MAPPING.get(validation_type)
        updated = False

        if self.CATEGORY_BY_COLUMN.get(validation_type):
            category = self.CATEGORY_BY_COLUMN[validation_type]
            for rule in validations.get(category, []):
                if key in rule:
                    self._update_rule(
                        rule[key],
                        total_valid,
                        count_persons_before_validation,
                        count_subtracted,
                        count_processed,
                        total_count,
                    )
                    updated = True
                    break

        else:
            for cat_rules in validations.values():
                for rule in cat_rules:
                    if key in rule:
                        self._update_rule(
                            rule[key],
                            total_valid,
                            count_persons_before_validation,
                            count_subtracted,
                            count_processed,
                            total_count,
                        )
                        updated = True

        if updated:
            self.audience_smarts_persistence.set_smart_audience_validations(
                validations=validations, aud_smart_id=aud_smart_id
            )
