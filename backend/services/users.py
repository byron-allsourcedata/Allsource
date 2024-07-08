import logging
from .user_persistence_service import UserPersistenceService
from backend.models.users import Users

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class UsersService:
    def __init__(self, user: Users, user_persistence_service: UserPersistenceService):
        self.user = user
        self.user_persistence_service = user_persistence_service

    def get_my_info(self):
        return {"email": self.user.email}
