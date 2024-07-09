import logging
from .user_persistence_service import UserPersistenceService
from models.users import Users

logger = logging.getLogger(__name__)


class UsersService:
    def __init__(self, user: Users, user_persistence_service: UserPersistenceService):
        self.user = user
        self.user_persistence_service = user_persistence_service


