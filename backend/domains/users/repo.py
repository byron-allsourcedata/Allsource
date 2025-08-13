from db_dependencies import Db
from domains.users.exceptions import UserNotFound
from models.users import Users
from resolver import injectable


@injectable
class UsersPersistence:
    def __init__(self, db: Db) -> None:
        self.db = db

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

    def commit(self):
        self.db.commit()
