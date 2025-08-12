import logging
from db_dependencies import Db
from domains.referrals.exceptions import InvalidReferralCode
from encryption_utils import decrypt_data
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class ReferralService:
    def __init__(self, db: Db) -> None:
        self.db = db

    def validate_code(self, referral_code: str) -> tuple[int, str]:
        """
        Raises InvalidReferralCode
        """
        try:
            parent_user_id, discount_code_id = decrypt_data(
                referral_code
            ).split(":")

            return int(parent_user_id), discount_code_id
        except Exception as e:
            raise InvalidReferralCode() from e
