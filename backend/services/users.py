import logging
from persistence.user_persistence import UserPersistence
from models.users import Users

logger = logging.getLogger(__name__)


class UsersService:
    def __init__(self, user: Users, user_persistence_service: UserPersistence):
        self.user = user
        self.user_persistence_service = user_persistence_service


