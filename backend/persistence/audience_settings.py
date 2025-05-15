import logging
import json
from sqlalchemy.orm import Session
from typing import Dict
from enums import AudienceSettingAlias

from models.audience_settings import AudienceSetting

logger = logging.getLogger(__name__)

class AudienceSettingPersistence:    
    def __init__(self, db: Session):
        self.db = db

    def get_average_success_validations(self) -> Dict[str, float]:
        stats = (
            self.db.query(AudienceSetting)
            .filter(AudienceSetting.alias == AudienceSettingAlias.AVERAGE_SUCCESS_VALIDATIONS.value)
        ).first()

        return json.loads(stats.value) if stats else {}

    def get_validation_priority(self) -> str:
        priority = (
            self.db.query(AudienceSetting)
            .filter(AudienceSetting.alias == AudienceSettingAlias.VALIDATION_PRIORITY.value)
        ).first()

        return priority.value