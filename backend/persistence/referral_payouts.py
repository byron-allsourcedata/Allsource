from sqlalchemy.orm import Session
from models.referral_payouts import ReferralPayouts
from datetime import datetime, timezone

class ReferralPayoutsPersistence:
    def __init__(self, db: Session):
        self.db = db
    
    def create_referral_payouts(self, reward_amount, user_id, referral_parent_id, reward_type):
        referral_payout = ReferralPayouts(
            parent_id=referral_parent_id,
            user_id=user_id,
            reward_amount=reward_amount,
            reward_type=reward_type,
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(referral_payout)
        self.db.commit()
    


