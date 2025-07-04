import logging
from models.privacy_policy_user import PrivacyPolicyUser
from db_dependencies import Db
from resolver import injectable
from sqlalchemy import exists


logger = logging.getLogger(__name__)


@injectable
class PrivacyPolicyPersistence:
    def __init__(self, db: Db):
        self.db = db

    def save_privacy_policy(
        self,
        email: str,
        version_privacy_policy: str,
        ip_address: str,
        user_id: int,
    ) -> None:
        record = PrivacyPolicyUser(
            email=email,
            ip=ip_address,
            version_privacy_policy=version_privacy_policy,
            user_id=user_id,
        )

        self.db.add(record)
        self.db.commit()

    def exist_user_privacy_policy(self, user_id: int) -> bool:
        return self.db.query(
            exists().where(PrivacyPolicyUser.user_id == user_id)
        ).scalar()
