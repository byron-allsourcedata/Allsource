import logging

from persistence.referral_discount_code_persistence import ReferralDiscountCodesPersistence
from dotenv import load_dotenv
from encryption_utils import encrypt_data
from persistence.user_persistence import UserPersistence
from services.stripe_service import get_stripe_account_info

logger = logging.getLogger(__name__)
load_dotenv()


class ReferralService:
    def __init__(self, referral_persistence_service: ReferralDiscountCodesPersistence, user_persistence: UserPersistence):
        self.referral_persistence_service = referral_persistence_service
        self.user_persistence = user_persistence

    def get_overview_info(self, user: dict):
        account = get_stripe_account_info(user.get('connected_stripe_account_id'))
        can_transfer = account.get("capabilities", {}).get("transfers", "") == "active"
        if can_transfer and not user.get('is_stripe_connect'):
            self.user_persistence.confirm_stripe_connect(user.get('id'))
        return {
                    'connected_stripe_account_id': user.get('connected_stripe_account_id'),
                    'is_stripe_connected': user.get('is_stripe_connected')
               }
        
    def get_referral_discount_code_by_id(self, discount_code_id: int, user: dict):
        discount_code = self.referral_persistence_service.get_referral_discount_code_by_id(discount_code_id)
        return {
            'referral_code': encrypt_data(f"{user.get('id')}:{discount_code.id}")
        }
        
    def get_referral_details(self, user: dict):
        discount_codes = self.referral_persistence_service.get_referral_discount_codes()
        user_id = user.get('id')
        if discount_codes:
            discount_code_id = discount_codes[0].id
            
        return {
            'discount_codes': [code.to_dict() for code in discount_codes],
            'referral_code': encrypt_data(f"{user_id}:{discount_code_id}")
        }
