from persistence.referral_payouts import ReferralPayoutsPersistence
from enums import PayoutsStatus, ConfirmationStatus, PayOutReferralsStatus
from collections import defaultdict
from persistence.referral_user import ReferralUserPersistence
from persistence.referral_payouts import ReferralPayoutsPersistence
from persistence.partners_persistence import PartnersPersistence
from services.stripe_service import StripeService
from typing import List, Dict
import os
from datetime import datetime

class PayoutsService:

    def __init__(self, referral_payouts_persistence: ReferralPayoutsPersistence, referral_user_persistence: ReferralUserPersistence, 
                 partners_persistence: PartnersPersistence, stripe_service: StripeService):
        self.referral_payouts_persistence = referral_payouts_persistence
        self.referral_user_persistence = referral_user_persistence
        self.partners_persistence = partners_persistence
        self.stripe_service = stripe_service
        
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
                payout.reward_amount for payout in month_payouts if payout.confirmation_status == ConfirmationStatus.APPROVED.value
            )
            
            payout_date = max(
                (payout.paid_at for payout in month_payouts if payout.paid_at is not None),
                default=None
            )

            payout_date_formatted = payout_date.strftime('%b %d, %Y') if payout_date else None
            
            month_name = datetime.strptime(month_year, '%Y-%m').strftime('%B')
            user_ids = {month_payout.parent_id for month_payout in month_payouts}
            partners = self.partners_persistence.get_partners_by_user_ids(user_ids)
    
            monthly_info.append({
                'month': month_name,
                'total_rewards': round(total_rewards, 2),
                'rewards_approved': round(rewards_approved, 2),
                'rewards_paid': round(rewards_paid, 2),
                'count_accounts': len(partners),
                'payout_date': payout_date_formatted
            })
        
        return monthly_info
    
    def check_payment_active_payouts(self, referral_payouts):
        has_pending_approved = any(
            referral_payout.confirmation_status == ConfirmationStatus.APPROVED.value 
            and referral_payout.status == PayoutsStatus.PENDING.value
            for referral_payout in referral_payouts
        )
        if has_pending_approved:
            return True
        
        return False
        
    def check_pending_referral_payouts(self, referral_payouts):            
        has_pending_approved = any(
            referral_payout.confirmation_status == ConfirmationStatus.APPROVED.value 
            and referral_payout.status == PayoutsStatus.PENDING.value
            for referral_payout in referral_payouts
        )
        
        if has_pending_approved:
            return PayoutsStatus.PENDING.value
        
        has_pending_pending = any(
            referral_payout.confirmation_status == ConfirmationStatus.PENDING.value 
            and referral_payout.status == PayoutsStatus.PENDING.value
            for referral_payout in referral_payouts
        )
        
        if has_pending_pending:
            return PayoutsStatus.PENDING.value

        return PayoutsStatus.PAID.value

    
    def process_partners_payouts(self, payouts: List, search_query: str, is_master: bool) -> List[Dict]:
        payouts = {payout.parent_id: payout for payout in payouts}.values()
        user_ids = {payout.parent_id for payout in payouts}
        partners = self.partners_persistence.get_partners_by_user_ids(user_ids, search_query)
        partners_dict = {partner.user_id: partner for partner in partners}
        referral_payouts = self.referral_payouts_persistence.get_referral_payouts_by_parent_ids(user_ids)
        referral_payouts_dict = {}
        for referral in referral_payouts:
            referral_payouts_dict.setdefault(referral.parent_id, []).append(referral)
        
        result = []
        for payout in payouts:
            partner = partners_dict.get(payout.parent_id)
            if partner:
                source = 'Direct'
                if partner.master_id:
                    master_partner = self.partners_persistence.get_asset_by_id(partner.master_id)
                    if master_partner:
                        source = master_partner.company_name
                
                referral_payouts_for_partner = referral_payouts_dict.get(payout.parent_id, [])
                
                reward_amount = sum(
                    referral.reward_amount for referral in referral_payouts_for_partner
                )
                
                rewards_approved = sum(
                    referral.reward_amount for referral in referral_payouts_for_partner if referral.confirmation_status == ConfirmationStatus.APPROVED.value
                )
                
                payout_date = max(
                    (referral.paid_at for referral in referral_payouts_for_partner if referral.paid_at is not None),
                    default=None
                )
                
                payout_date_formatted = payout_date.strftime('%b %d, %Y') if payout_date else None
                join_date = partner.created_at.strftime('%b %d, %Y')
                if is_master:
                    result.append({
                        'partner_id': partner.id,
                        'company_name': partner.company_name,
                        'email': partner.email,
                        'join_date': join_date,
                        'commission': partner.commission,
                        'reward_amount': reward_amount,
                        'reward_approved': rewards_approved,
                        'reward_payout_date': payout_date_formatted,
                        'reward_status': self.check_pending_referral_payouts(referral_payouts_for_partner),
                        'is_payment_active': self.check_payment_active_payouts(referral_payouts_for_partner)
                    })
                else:
                    result.append({
                        'partner_id': partner.id,
                        'company_name': partner.company_name,
                        'email': partner.email,
                        'sources': source,
                        'number_of_accounts': len(referral_payouts_for_partner),
                        'reward_amount': reward_amount,
                        'reward_approved': rewards_approved,
                        'reward_payout_date': payout_date_formatted,
                        'reward_status': self.check_pending_referral_payouts(referral_payouts_for_partner),
                        'is_payment_active': self.check_payment_active_payouts(referral_payouts_for_partner)
                    })
        
        return result
    
    def process_partner_payouts(self, referral_payouts):
        processed_payouts = []

        for referral_payout in referral_payouts:
            referral_link = f"{os.getenv('SITE_HOST_URL')}signup?coupon={referral_payout.coupon}" 
            processed_payouts.append({
                'referral_payouts_id': referral_payout.id,
                'user_id': referral_payout.user_id,
                'company_name': referral_payout.company_name,
                'email': referral_payout.email,
                'join_date': referral_payout.created_at.strftime('%Y-%m-%d') if referral_payout.created_at else None,
                'plan_amount': referral_payout.plan_amount,
                'reward_amount': referral_payout.reward_amount,
                'payout_date': referral_payout.paid_at.strftime('%Y-%m-%d') if referral_payout.paid_at else None,
                'referral_link': referral_link,
                'comment': referral_payout.comment,
                'reward_status': referral_payout.confirmation_status
            })

        return processed_payouts


        
    def get_payouts_partners(self, year, month, partner_id, search_query, is_master, reward_type, from_date, to_date, sort_by, sort_order):
        if year and month and partner_id:
            referral_payouts = self.referral_payouts_persistence.get_referral_payouts_by_partner_id(year=year, month=month, partner_id=partner_id, search_query=search_query, reward_type=reward_type, from_date=from_date, to_date=to_date, sort_by=sort_by, sort_order=sort_order)
            return self.process_partner_payouts(referral_payouts)
        
        if year and month:
            payouts = self.referral_payouts_persistence.get_all_referral_payouts(is_master=is_master, year=year, month=month, from_date=from_date, to_date=to_date)
            return self.process_partners_payouts(payouts, search_query=search_query, is_master=is_master)
        
        if year:
            payouts = self.referral_payouts_persistence.get_all_referral_payouts(is_master=is_master, year=year)
            return self.process_monthly_payouts(payouts)
        
    def update_payouts_partner(self, referral_payout_id, text ,confirmation_status):
        if confirmation_status == 'approve':
            confirmation_status = ConfirmationStatus.APPROVED.value
        elif confirmation_status == 'reject':
            confirmation_status = ConfirmationStatus.REJECT.value
        else:
            confirmation_status = ConfirmationStatus.PENDING.value
            
        return self.referral_payouts_persistence.update_payouts_partner_confirmation_status(referral_payout_id ,confirmation_status=confirmation_status, text=text)
    
    def is_transfer_successful(self, transfer_response):
        return (
            transfer_response.get("id") is not None and
            not transfer_response.get("reversed", True) and
            transfer_response.get("amount") > 0
        )
    
    def pay_out_referrals(self, partner_id):
        result = self.partners_persistence.get_stripe_account_and_total_reward_by_partner_id(partner_id=partner_id)
        if result:
            stripe_account_id, total_reward, payout_ids = result
            result_transfer = self.stripe_service.create_stripe_transfer(total_reward, stripe_account_id)
            if self.is_transfer_successful(result_transfer):
                for payout_id in payout_ids:
                    self.referral_payouts_persistence.update_payouts_partner_status(payout_id, PayoutsStatus.PAID.value)
                return PayOutReferralsStatus.SUCCESS.value
            
            return PayOutReferralsStatus.PAYMENT_ERROR.value
        else:
            return PayOutReferralsStatus.NO_USERS_FOR_PAYOUT.value
    
    def pay_overview_payout_history(self, page, per_page, from_date, to_date):
        history_list, total_count, max_page = self.referral_payouts_persistence.get_overview_payout_history(page, per_page, from_date, to_date)
        return {
                'history_list': history_list,
                'total_count': total_count,
                'max_page':max_page
            }
        
        