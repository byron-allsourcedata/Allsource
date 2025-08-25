import json

from bin.audience_validations_filler import REVERSE_DATABASE_MAPPING
from db_dependencies import Db
from models import AudienceSmart
from resolver import injectable


@injectable
class ValidationStatsService:
    def __init__(
        self,
        db: Db,
    ):
        self.db = db

    def update_step_processed(
        self, aud_smart_id: int, validation_type: str, batch_size: int
    ):
        smart = (
            self.db.query(AudienceSmart)
            .filter(AudienceSmart.id == aud_smart_id)
            .first()
        )
        if not smart:
            return

        # validation agent receives already mapped validation type, but for eta calculation we need the initial one
        validation_type = REVERSE_DATABASE_MAPPING[validation_type]

        step_processed = json.loads(smart.validations_step_processed or "{}")
        step_processed[validation_type] = (
            step_processed.get(validation_type, 0) + batch_size
        )
        smart.validations_step_processed = json.dumps(step_processed)
        self.db.add(smart)
        self.db.commit()
