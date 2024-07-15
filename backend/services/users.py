import logging

from enums import UpdatePasswordStatus
from persistence.user_persistence import UserPersistence
from models.users import Users
from schemas.users import UpdatePassword
from services.jwt_service import get_password_hash

logger = logging.getLogger(__name__)


class UsersService:
    def __init__(self, user: Users, user_persistence_service: UserPersistence):
        self.user = user
        self.user_persistence_service = user_persistence_service

    def update_password(self, update_data: UpdatePassword):
        if update_data.password != update_data.confirm_password:
            return UpdatePasswordStatus.PASSWORDS_DO_NOT_MATCH
        update_data.password = get_password_hash(update_data.password)
        logger.info('update password success')
        self.user_persistence_service.update_password(self.user.id, update_data.password)
        return UpdatePasswordStatus.PASSWORD_UPDATED_SUCCESSFULLY

    def get_my_info(self):
        return {"email": self.user.email,
                "full_name": self.user.full_name
                }
