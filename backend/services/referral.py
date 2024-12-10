import logging

from persistence.referral_persistence import ReferralPersistence
from dotenv import load_dotenv


logger = logging.getLogger(__name__)
load_dotenv()


class ReferralService:
    def __init__(self, user, referral_persistence_service: ReferralPersistence):
        self.user = user
        self.referral_persistence_service = referral_persistence_service

    def get_overview_info(self, user):
        overview_info = self.referral_persistence_service.get_stripe_info_by_id(user_id=user.get('id'))
        if overview_info:
            return overview_info
        return None
