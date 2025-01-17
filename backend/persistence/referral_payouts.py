from sqlalchemy.orm import Session
from models.referral_payouts import ReferralPayouts
from datetime import datetime, timezone
from sqlalchemy import func, extract
from models.referral_users import ReferralUser

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
    
    def get_all_referral_payouts(self, year, month):
        query = self.db.query(ReferralPayouts)
        
        if year:
            query = query.filter(extract("year", ReferralPayouts.created_at) == year)

        if month:
            try:
                month_number = {
                    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
                    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12
                }[month.lower()]
                query = query.filter(extract("month", ReferralPayouts.created_at) == month_number)
            except KeyError:
                raise ValueError(f"Invalid month name: {month}")
    
        result = query.all()
        return result
