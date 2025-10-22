import logging

from schemas.teams import ChosenOwnerUser
from persistence.teams import TeamsPersistence
from resolver import injectable

logger = logging.getLogger(__name__)


# NEED MOVE FROM SETTING SERVICE
@injectable
class TeamsService:
    def __init__(
        self,
        teams_persistence: TeamsPersistence,
    ):
        self.teams_persistence = teams_persistence

    def set_team_member(self, chosen_owner_user: ChosenOwnerUser, user_id: int):
        count_updated = self.teams_persistence.assign_team_member(
            owner_id=chosen_owner_user.id, user_id=user_id
        )
        return count_updated == 2
