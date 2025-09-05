from datetime import datetime

from sqlalchemy import select, update
from db_dependencies import Db
from domains.users.exceptions import UserNotFound
from models.users import Users
from resolver import injectable


@injectable
class UsersPersistence:
    def __init__(self, db: Db) -> None:
        self.db = db

    def _by_id(self, user_id: int) -> Users | None:
        return self.db.execute(
            select(Users).where(Users.id == user_id)
        ).scalar()

    def stripe_customer_id_by_id(self, user_id: int) -> str:
        user = self._by_id(user_id)
        if user is None:
            raise UserNotFound(user_id)
        return user.customer_id

    def full_name_by_id(self, user_id: int) -> str | None:
        user = self._by_id(user_id)
        if user is None:
            return None
        return user.full_name

    def update_user_by_id(self, user_id: int) -> Users | None:
        return (
            self.db.query(Users)
            .where(Users.id == user_id)
            .with_for_update()
            .first()
        )

    def toggle_whitelabel_settings(self, user_id: int, is_enabled: bool):
        """
        Raises UserNotFound
        """
        user = self.update_user_by_id(user_id)

        if user is None:
            raise UserNotFound(
                f"User with id {user_id} not found",
            )

        user.whitelabel_settings_enabled = is_enabled
        self.db.flush()

    def get_pixel_code_last_sent(self, user_id: int) -> datetime | None:
        return self.db.execute(
            select(Users.pixel_code_sent_at).where(Users.id == user_id)
        ).scalar()

    def set_pixel_code_last_sent(
        self, user_id: int, pixel_code_sent_at: datetime
    ):
        _ = self.db.execute(
            update(Users)
            .where(Users.id == user_id)
            .values(pixel_code_sent_at=pixel_code_sent_at)
        )
        self.commit()

    def commit(self):
        self.db.commit()
