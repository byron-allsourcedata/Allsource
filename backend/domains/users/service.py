from domains.users.repo import UsersPersistence
from resolver import injectable


@injectable
class UsersService:
    def __init__(self, repo: UsersPersistence) -> None:
        self.repo = repo

    def toggle_whitelabel_settings(self, user_id: int, is_enabled: bool):
        """
        Raises UserNotFound
        """
        self.repo.toggle_whitelabel_settings(user_id, is_enabled)
