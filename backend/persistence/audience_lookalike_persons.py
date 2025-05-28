from uuid import UUID

from db_dependencies import Db
from models import AudienceLookalikesPerson
from resolver import injectable


@injectable
class AudienceLookalikesPersonPersistence:
    def __init__(self, db: Db):
        self.db = db

    def by_lookalike_id(self, lookalike_id: UUID):
        return (
            self.db
            .query(AudienceLookalikesPerson.enrichment_user_id)
            .filter(AudienceLookalikesPerson.lookalike_id == lookalike_id)
            .all()
        )