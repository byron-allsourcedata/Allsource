from sqlalchemy.orm import Session,
from models.referral_payouts import ReferralPayouts
from sqlalchemy import func, extract
from models.users import Users
from sqlalchemy import and_, or_, desc, asc, Integer
from models.referral_users import ReferralUser
from datetime import datetime
import pytz

class ReferralUserPersistence:
    def __init__(self, db: Session):
        self.db = db
    
    def get_referral_users(self, partner_id, search_term, start_date, end_date, offset, limit):
        query = self.db.query(Users.company_name, Users.email, ReferralUser.created_at, ReferralPayouts.created_at, ReferralPayouts.status).filter(ReferralUser.partner_id == partner_id)

        if search_term:
            query = query.filter(or_(
                    Users.name.ilike(f'{search_term}%'),
                    Users.name.ilike(f'{search_term}%'))
            )
            
        if start_date and end_date:
            start_date = datetime.fromtimestamp(start_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(end_date, tz=pytz.UTC)
            query = query.filter(
                and_(
                    ReferralUser.created_at >= start_date,
                    ReferralUser.created_at <= end_date
                )
            )

        return query.offset(offset).limit(limit).all()
    
        # accounts, total_count
        
        # plan_amount: string;
        # reward_amount: string;
        # reward_payout_date: string;
        # status: string;