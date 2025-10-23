from db_dependencies import Db
from models.users import Users
from enums import TeamAccessLevel

from resolver import injectable


@injectable
class TeamsPersistence:
    def __init__(self, db: Db):
        self.db = db

    def assign_team_member(self, owner_id: int, user_id: str) -> int:
        count_member = (
            self.db.query(Users)
            .filter(Users.id == user_id)
            .update(
                {
                    Users.team_owner_id: owner_id,
                    Users.team_access_level: TeamAccessLevel.READ_ONLY.value,
                },
                synchronize_session=False,
            )
        )

        count_owner = (
            self.db.query(Users)
            .filter(Users.id == owner_id)
            .update(
                {Users.team_access_level: TeamAccessLevel.OWNER.value},
                synchronize_session=False,
            )
        )
        self.db.commit()
        return (count_member or 0) + (count_owner or 0)
