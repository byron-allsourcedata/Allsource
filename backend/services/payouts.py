from persistence.referral_payouts import ReferralPayoutsPersistence
from enums import PayoutsStatus, ConfirmationStatus
from collections import defaultdict
from persistence.referral_user import ReferralUserPersistence
from persistence.referral_payouts import ReferralPayoutsPersistence
from persistence.partners_persistence import PartnersPersistence
from typing import List, Dict
import os

class PayoutsService:

    def __init__(self, referral_payouts_persistence: ReferralPayoutsPersistence, referral_user_persistence: ReferralUserPersistence, partners_persistence: PartnersPersistence):
        self.referral_payouts_persistence = referral_payouts_persistence
        self.referral_user_persistence = referral_user_persistence
        self.partners_persistence = partners_persistence
        
    def process_monthly_payouts(self, payouts: List) -> List[Dict]:
        grouped_by_month = defaultdict(list)
        for payout in payouts:
            month_year = payout.created_at.strftime('%Y-%m')
            grouped_by_month[month_year].append(payout)
        
        monthly_info = []
        
        for month_year, month_payouts in grouped_by_month.items():
            total_rewards = sum(payout.reward_amount for payout in month_payouts)
            rewards_paid = rewards_paid = sum(
                payout.reward_amount for payout in month_payouts if payout.status == PayoutsStatus.PAID.value
            )
            rewards_approved = sum(
                payout.reward_amount for payout in month_payouts if payout.confirmation_status == ConfirmationStatus.PENDING.value
            )
            
            payout_date = max(
                (payout.paid_at for payout in month_payouts if payout.paid_at is not None),
                default=None
            )

            payout_date_formatted = payout_date.strftime('%b %d, %Y') if payout_date else None
            month_name = payout_date.strftime('%B') if payout_date else ""
                
            monthly_info.append({
                'month': month_name,
                'total_rewards': round(total_rewards, 2),
                'rewards_approved': round(rewards_approved, 2),
                'rewards_paid': round(rewards_paid, 2),
                'count_accounts': len(month_payouts),
                'payout_date': payout_date_formatted
            })
        
        return monthly_info
    
    def check_pending_referral_payouts(self, referral_payouts):
        for referral_payout in referral_payouts:
            if referral_payout.confirmation_status == ConfirmationStatus.APPROVED.value and referral_payout.status == PayoutsStatus.PENDING.value:
                return PayoutsStatus.PENDING.value
        return PayoutsStatus.PAID.value
    
    def process_partners_payouts(self, payouts: List) -> List[Dict]:
        user_ids = {payout.user_id for payout in payouts}
        partners = self.partners_persistence.get_partners_by_user_ids(user_ids)
        partners_dict = {partner.user_id: partner for partner in partners}
        
        result = []
        for payout in payouts:
            partner = partners_dict.get(payout.user_id)
            if partner:
                source = 'Direct'
                if partner.master_id:
                    master_partner = self.partners_persistence.get_asset_by_id(partner.master_id)
                    if master_partner:
                        source = master_partner.company_name
                referral_payouts = self.referral_payouts_persistence.get_referral_payouts_by_parent_id(payout.user_id)
                
                rewards_paid = sum(
                    payout.reward_amount for payout in referral_payouts if payout.status == PayoutsStatus.PAID.value
                )
                rewards_approved = sum(
                    payout.reward_amount for payout in referral_payouts if payout.confirmation_status == ConfirmationStatus.PENDING.value
                )
                payout_date = max(
                    (payout.paid_at for payout in referral_payouts if payout.paid_at is not None),
                    default=None
                )
                
                payout_date_formatted = payout_date.strftime('%b %d, %Y') if payout_date else None
                
                result.append({
                    'partner_id': partner.id,
                    'company_name': partner.company_name,
                    'email': partner.email,
                    'sources': source,
                    'number_of_accounts': len(referral_payouts),
                    'reward_amount': rewards_paid,
                    'reward_approved': rewards_approved,
                    'reward_payout_date': payout_date_formatted,
                    'reward_status': self.check_pending_referral_payouts(referral_payouts),
                })
        
        return result
    
    def process_partner_payouts(self, referral_payouts):
        processed_payouts = []

        for referral_payout in referral_payouts:
            referral_link = f"{os.getenv('SITE_URL')}signup?coupon={referral_payout.coupon}" 
            processed_payouts.append({
                'referral_payouts_id': referral_payout.referral_payouts_id,
                'user_id': referral_payout.user_id,
                'company_name': referral_payout.company_name,
                'email': referral_payout.email,
                'join_date': referral_payout.created_at.strftime('%Y-%m-%d') if referral_payout.created_at else None,
                'plan_amount': referral_payout.plan_amount,
                'reward_amount': referral_payout.reward_amount,
                'payout_date': referral_payout.paid_at.strftime('%Y-%m-%d') if referral_payout.paid_at else None,
                'referral_link': referral_link,
                'comment': '-',
                'reward_status': referral_payout.confirmation_status
            })

        return processed_payouts


        
    def get_payouts_partners(self, year, month, partner_id):
        if year and month and partner_id:
            referral_payouts = self.referral_payouts_persistence.get_referral_payouts_by_partner_id(year=year, month=month, partner_id=partner_id)
            return self.process_partner_payouts(referral_payouts)
        
        if year and month:
            payouts = self.referral_payouts_persistence.get_all_referral_payouts(year=year, month=month)
            return self.process_partners_payouts(payouts)
        
        if year:
            payouts = self.referral_payouts_persistence.get_all_referral_payouts(year=year)
            return self.process_monthly_payouts(payouts)
