import logging
import json
from sqlalchemy.orm import Session
from typing import Dict
from enums import AudienceSettingAlias
from db_dependencies import Db

from models.audience_settings import AudienceSetting
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class AudienceSettingPersistence:
    def __init__(self, db: Db):
        self.db = db

    def get_average_success_validations(self) -> Dict[str, float]:
        stats = (
            self.db.query(AudienceSetting).filter(
                AudienceSetting.alias
                == AudienceSettingAlias.AVERAGE_SUCCESS_VALIDATIONS.value
            )
        ).first()

        return json.loads(stats.value) if stats else {}

    def get_cost_validations(self) -> Dict[str, float]:
        costs = (
            self.db.query(AudienceSetting).filter(
                AudienceSetting.alias
                == AudienceSettingAlias.VALIDATION_COST.value
            )
        ).first()

        return json.loads(costs.value) if costs else {}

    def get_validation_priority(self) -> str:
        priority = (
            self.db.query(AudienceSetting).filter(
                AudienceSetting.alias
                == AudienceSettingAlias.VALIDATION_PRIORITY.value
            )
        ).first()

        return priority.value

    def get_stats_validations(self) -> str:
        return (
            self.db.query(AudienceSetting).filter(
                AudienceSetting.alias
                == AudienceSettingAlias.STATS_VALIDATIONS.value
            )
        ).first()

    def set_stats_item_validations(self, stats_item):
        new_record = AudienceSetting(
            alias=AudienceSettingAlias.STATS_VALIDATIONS.value,
            value=json.dumps(stats_item),
        )
        self.db.add(new_record) 
    

    def upsert_stats_validations(self, data: dict):
        record = self.get_stats_validations()

        if record:
            record.value = json.dumps(data)
        else:
            record = AudienceSetting(
                alias=AudienceSettingAlias.STATS_VALIDATIONS.value,
                value=json.dumps(data),
            )
            self.db.add(record)
