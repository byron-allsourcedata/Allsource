from sqlalchemy.orm import Session
from models.referral_payouts import ReferralPayouts
from datetime import datetime, timezone
from sqlalchemy import extract, or_, func
from models.referral_users import ReferralUser
from models.partner import Partner
from models.users import Users
from enums import ConfirmationStatus, PayoutsStatus
from models.referral_discount_codes import ReferralDiscountCode

class ReferralPayoutsPersistence:
    def __init__(self, db: Session):
        self.db = db
    
    def create_referral_payouts(self, reward_amount, user_id, referral_parent_id, reward_type, plan_amount):
        referral_payout = ReferralPayouts(
            parent_id=referral_parent_id,
            user_id=user_id,
            reward_amount=reward_amount,
            reward_type=reward_type,
            created_at=datetime.now(timezone.utc),
            plan_amount=plan_amount
        )
        self.db.add(referral_payout)
        self.db.commit()
        
    def get_stripe_account_and_total_reward_by_payout_id(self, referral_payout_id):
        return self.db.query(
            Users.connected_stripe_account_id,
            func.sum(ReferralPayouts.reward_amount).label('total_reward')
        )\
        .join(ReferralPayouts, ReferralPayouts.parent_id == Users.id)\
        .filter(
            ReferralPayouts.id == referral_payout_id,
            ReferralPayouts.confirmation_status == ConfirmationStatus.APPROVED.value,
            ReferralPayouts.status == PayoutsStatus.PENDING.value
        )\
        .group_by(Users.connected_stripe_account_id)\
        .first()
        
    def update_payouts_partner(self, referral_payout_id: int, text: str, confirmation_status):
        referral_payout = self.db.query(ReferralPayouts).filter(ReferralPayouts.id == referral_payout_id).first()
        if not referral_payout:
            return 'PAYOUTS_PARTNER_NOT_FOUND'
        
        if text:
            referral_payout.comment = text
            
        referral_payout.confirmation_status = confirmation_status
        
        self.db.commit()
        return 'SUCCESS'
    
    def get_referral_payouts_by_parent_id(self, parent_id):
        return self.db.query(ReferralPayouts).filter(ReferralPayouts.parent_id == parent_id).all()
    
    def get_referral_payouts_by_parent_ids(self, user_ids):
        return self.db.query(ReferralPayouts).filter(ReferralPayouts.parent_id.in_(user_ids)).all()
    
    def get_all_referral_payouts(self, year=None, month=None):
        query = self.db.query(ReferralPayouts)
        
        if year:
            query = query.filter(extract("year", ReferralPayouts.created_at) == year)
        
        if month:
            query = query.filter(extract("month", ReferralPayouts.created_at) == month)
        
        return query.order_by(ReferralPayouts.created_at.desc()).all()
    
    def get_referral_payouts_by_partner_id(self, year, month, partner_id, search_query):
        query = self.db.query(
            Partner.id,
            ReferralPayouts.id,
            ReferralPayouts.reward_amount,
            ReferralPayouts.paid_at,
            ReferralPayouts.plan_amount,
            ReferralPayouts.confirmation_status,
            ReferralPayouts.comment,
            Users.company_name,
            Users.email,
            Users.id.label('user_id'),
            Users.created_at,
            ReferralDiscountCode.coupon,
        ).join(
           ReferralPayouts, ReferralPayouts.parent_id == Partner.user_id
        ).join(
            ReferralUser, ReferralUser.user_id == ReferralPayouts.user_id
        ).join(
            Users, Users.id == ReferralPayouts.user_id
        ).join(
            ReferralDiscountCode, ReferralDiscountCode.id == ReferralUser.discount_code_id
        ).filter(
            Partner.id == partner_id
        ).order_by(
            ReferralPayouts.created_at.desc()
        )
        
        if search_query:
            filters = [
                ReferralPayouts.reward_amount.ilike(f'{search_query}%'),
                ReferralPayouts.paid_at.ilike(f'{search_query}%'),
                ReferralPayouts.plan_amount.ilike(f'{search_query}%'),
                ReferralPayouts.comment.ilike(f'{search_query}%'),
                Users.company_name.ilike(f'{search_query}%'),
                Users.email.ilike(f'{search_query}%'),
                ReferralPayouts.confirmation_status.ilike(f'{search_query}%')
            ]
            query = query.filter(or_(*filters))
        
        if year:
            query = query.filter(extract("year", ReferralPayouts.created_at) == year)
        
        if month:
            query = query.filter(extract("month", ReferralPayouts.created_at) == month)
            
        return query.all()
