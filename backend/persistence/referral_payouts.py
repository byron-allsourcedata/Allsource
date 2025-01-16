from sqlalchemy.orm import Session
from models.referral_payouts import ReferralPayouts


class ReferralPayoutsPersistence:
    def __init__(self, db: Session):
        self.db = db
    
    def save_referral_payouts(self, reward_amount, user_id, referral_parent_id):
        referral_payout = ReferralPayouts(
            parent_id=referral_parent_id,
            user_id=user_id,
            reward_amount=reward_amount,
            reward_type='partners'
        )
        self.db.add(referral_payout)
        self.db.commit()
    


