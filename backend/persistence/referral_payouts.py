from sqlalchemy.orm import Session
from models.referral_payouts import ReferralPayouts
from datetime import datetime, timezone
from sqlalchemy import func, extract
from models.referral_users import ReferralUser
from models.partner import Partner
from models.users import Users
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
    
    def get_referral_payouts_by_parent_id(self, parent_id):
        return self.db.query(ReferralPayouts).filter(ReferralPayouts.parent_id == parent_id).all()
    
    def get_all_referral_payouts(self, year=None, month=None):
        query = self.db.query(ReferralPayouts)
        
        if year:
            query = query.filter(extract("year", ReferralPayouts.created_at) == year)
        
        if month:
            query = query.filter(extract("month", ReferralPayouts.created_at) == month)
        
        return query.all()
    
    def get_referral_payouts_by_company_name(self, year, month, company_name):
        query = self.db.query(
            ReferralPayouts.id,
            ReferralPayouts.reward_amount,
            ReferralPayouts.paid_at,
            ReferralPayouts.plan_amount,
            ReferralPayouts.confirmation_status,
            ReferralDiscountCode.coupon,
            Users.company_name,
            Users.email,
            Users.id.label('user_id'),
            Users.created_at
            ) .join(Users, Users.id == ReferralPayouts.user_id)\
            .outerjoin(ReferralUser, ReferralUser.user_id == ReferralPayouts.user_id)\
            .outerjoin(ReferralDiscountCode, ReferralDiscountCode.id == ReferralUser.discount_code_id)\
            .filter(Users.company_name == company_name)\
            .filter(extract("year", ReferralPayouts.created_at) == year)\
            .filter(extract("month", ReferralPayouts.created_at) == month)

        return query.all()
