from sqlalchemy import select, update
from db_dependencies import Db
from domains.users.exceptions import UserNotFound
from models.users import Users
from resolver import injectable


@injectable
class UsersFundsPersistence:
    def __init__(self, db: Db) -> None:
        self.db = db

    def get_premium_source_funds(self, user_id: int):
        """
        get premium source funds as cents

        Raises `UserNotFound`
        """
        user = self.db.execute(
            select(Users).where(Users.id == user_id)
        ).scalar()

        if not user:
            raise UserNotFound()

        # unlimited values
        if (
            user.premium_source_credits == -1
            or user.premium_source_credits is None
        ):
            return None

        return int(user.premium_source_credits * 100)

    def deduct_funds(self, user_id: int, amount: int):
        """
        Unsafely deduct funds from maybe unexisting user
        """
        updated_rows = self.db.execute(
            update(Users)
            .where(Users.id == user_id)
            .values(
                premium_source_credits=Users.premium_source_credits - amount
            ),
        ).rowcount

        return updated_rows
