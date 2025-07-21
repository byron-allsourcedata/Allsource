from sqlalchemy import select
from models.users import Users
from resolver import injectable

from db_dependencies import Db


@injectable
class AudienceQuotaPersistence:
    def __init__(self, db: Db):
        self.db = db

    def by_user_id(self, user_id: int) -> int | None:
        """
        None is returned if
        - user does not exist
        - quota is not set
        """
        return self.db.execute(
            select(Users.smart_audience_quota).filter(Users.id == user_id)
        ).scalar()

    def deduct(self, user_id: int, deduction: int) -> int:
        user = self.db.execute(
            select(Users).filter(Users.id == user_id).with_for_update()
        ).scalar_one()

        new_quota = user.smart_audience_quota - deduction
        user.smart_audience_quota = new_quota if new_quota > 0 else 0

        return new_quota
