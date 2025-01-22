import logging

from persistence.referral_discount_code_persistence import ReferralDiscountCodesPersistence
from dotenv import load_dotenv
from encryption_utils import encrypt_data
from persistence.user_persistence import UserPersistence
from services.jwt_service import create_access_token
from services.stripe_service import StripeService
from persistence.referral_payouts import ReferralPayoutsPersistence
from enums import PayoutsStatus
from collections import defaultdict
logger = logging.getLogger(__name__)
load_dotenv()


class ReferralService:
    def __init__(self, referral_persistence_service: ReferralDiscountCodesPersistence,
                 user_persistence: UserPersistence, stripe_service: StripeService, referral_payouts_persistence: ReferralPayoutsPersistence):
        self.referral_persistence_service = referral_persistence_service
        self.user_persistence = user_persistence
        self.stripe_service = stripe_service
        self.referral_payouts_persistence = referral_payouts_persistence

    def get_overview_info(self, user: dict):
        account = {}
        if user.get('connected_stripe_account_id'):
            try:
                account = self.stripe_service.get_stripe_account_info(user.get('connected_stripe_account_id'), user.get('id'))
            except:
                self.user_persistence.delete_stripe_info(user_id=user.get('id'))
            
        email = account.get('email')
        currently_due = account.get('requirements', {}).get('currently_due', [])
        can_transfer = account.get("capabilities", {}).get("transfers", "") == "active"

        if can_transfer and not user.get('is_stripe_connect'):
            self.user_persistence.confirm_stripe_connect(user.get('id'))

            return {
                'connected_stripe_account_id': user.get('connected_stripe_account_id'),
                'is_stripe_connected': True,
                'stripe_connected_email': user.get('stripe_connected_email'),
            }

        if (email or currently_due) and not user.get('is_stripe_connect'):
            self.user_persistence.update_stripe_info(
                user_id=user.get('id'),
                email=email,
                currently_due=currently_due
            )
            return {
                'connected_stripe_account_id': user.get('connected_stripe_account_id'),
                'is_stripe_connected': user.get('is_stripe_connected'),
                'stripe_connected_email': email,
                'stripe_connected_currently_due': currently_due
            }
        return {
            'connected_stripe_account_id': user.get('connected_stripe_account_id'),
            'is_stripe_connected': user.get('is_stripe_connected'),
            'stripe_connected_email': user.get('stripe_connected_email'),
            'stripe_connected_currently_due': user.get('stripe_connected_currently_due')
        }

    def get_referral_discount_code_by_id(self, discount_code_id: int, user: dict):
        if user.get('partner_is_active') is False and user.get('is_stripe_connected') == False:
            return {
            'discount_codes': None,
            'referral_code': None
        }
            
        discount_code = self.referral_persistence_service.get_referral_discount_code_by_id(discount_code_id)
        
        return {
            'referral_code': encrypt_data(f"{user.get('id')}:{discount_code.id}")
        }
    
    def create_referral_payouts(self, reward_amount, user_id, referral_parent_id, reward_type, plan_amount):
        self.referral_payouts_persistence.create_referral_payouts(reward_amount, user_id, referral_parent_id, reward_type, plan_amount)
        

    def get_referral_details(self, user: dict):
        discount_codes = self.referral_persistence_service.get_referral_discount_codes()
        user_id = user.get('id')
        formatted_discount_codes = None
        referral_code = None

        if user.get('is_stripe_connected') is False:
            return {
                'discount_codes': formatted_discount_codes,
                'referral_code': referral_code
            }
                
        if user.get('partner_is_active') is False:
            return {
                'discount_codes': formatted_discount_codes,
                'referral_code': referral_code
            }
            
        if discount_codes:
            formatted_discount_codes = [code.to_dict() for code in discount_codes]
            
        return {
            'discount_codes': formatted_discount_codes,
            'referral_code': encrypt_data(f"{user_id}:")
        }

    def get_rewards_info(self, year: str, month: int, company_name: str):
        payouts = self.referral_payouts_persistence.get_all_referral_payouts(year=year, month=month)
        grouped_by_month = defaultdict(list)
        for payout in payouts:
            month_year = payout.created_at.strftime('%Y-%m')
            grouped_by_month[month_year].append(payout)
        
        monthly_info = []
        
        for month_year, month_payouts in grouped_by_month.items():
            total_rewards = sum(payout.reward_amount for payout in month_payouts)
            rewards_paid = sum(
                payout.reward_amount for payout in month_payouts if payout.status == PayoutsStatus.PAID.value
            )
            
            payout_date = max(
                (payout.created_at for payout in month_payouts),
                default=None
            )
            
            payout_date_formatted = payout_date.strftime('%b %d, %Y') if payout_date else None
            month_name = payout_date.strftime('%B') if payout_date else ""
            
            monthly_info.append({
                'month': month_name,
                'totalRewards': round(total_rewards, 2),
                'rewardsPaid': round(rewards_paid, 2),
                'invitesCount': 1,
                'payoutDate': payout_date_formatted
            })


        
        return monthly_info

    def generate_access_token(self, user: dict, user_account_id: int):
        if self.referral_persistence_service.verify_user_relationship(parent_id=user.get('id'), user_id=user_account_id):
            token_info = {
                "id": user_account_id,
                "requester_access_user_id": user.get('id')
            }
            return create_access_token(token_info)
        return None
