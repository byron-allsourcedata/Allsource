import logging
from uuid import UUID
from resolver import injectable
from services.lookalikes import AudienceLookalikesService


logger = logging.getLogger(__name__)


@injectable
class LookalikeAgentService:
    def __init__(self, lookalikes: AudienceLookalikesService):
        self.lookalikes = lookalikes

    def get_top_enrichment_users(self, lookalike_id: UUID) -> list[UUID] | None:
        return self.lookalikes.get_lookalike_asids(lookalike_id)
