from datetime import datetime
from domains.users.repo import UsersPersistence
from resolver import injectable


@injectable
class UsersService:
    def __init__(self, repo: UsersPersistence) -> None:
        self.repo = repo

    def name_by_id(self, user_id: int) -> str | None:
        return self.repo.full_name_by_id(user_id)

    def toggle_whitelabel_settings(self, user_id: int, is_enabled: bool):
        """
        Raises UserNotFound
        """
        self.repo.toggle_whitelabel_settings(user_id, is_enabled)

    def get_pixel_code_last_sent(self, user_id: int) -> datetime | None:
        return self.repo.get_pixel_code_last_sent(user_id)

    def set_pixel_code_last_sent(
        self, user_id: int, pixel_code_sent_at: datetime
    ):
        self.repo.set_pixel_code_last_sent(user_id, pixel_code_sent_at)
