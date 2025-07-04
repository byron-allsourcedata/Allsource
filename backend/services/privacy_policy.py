from persistence.privacy_policy import PrivacyPolicyPersistence
from resolver import injectable
from schemas.privacy_policy import PrivacyPolicyRequest
from models.users import User


@injectable
class PrivacyPolicyService:
    def __init__(
        self,
        privacy_policy_persistence: PrivacyPolicyPersistence,
    ):
        self.privacy_policy_persistence = privacy_policy_persistence

    def save_privacy_policy(
        self,
        user: User,
        privacy_policy_data: PrivacyPolicyRequest,
        ip_address: str,
    ) -> None:
        self.privacy_policy_persistence.save_privacy_policy(
            ip_address=ip_address,
            version_privacy_policy=privacy_policy_data.version_privacy_policy,
            email=user.get("email"),
            user_id=user.get("id"),
        )

    def exist_user_privacy_policy(self, user_id: int) -> bool:
        return self.privacy_policy_persistence.exist_user_privacy_policy(
            user_id=user_id
        )
