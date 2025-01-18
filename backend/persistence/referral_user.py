from sqlalchemy.orm import Session
from models.referral_payouts import ReferralPayouts
from sqlalchemy import func, extract
from models.users import Users
from models.partner import Partner
from models.subscriptions import UserSubscriptions
from sqlalchemy import and_, or_, desc, asc, Integer
from models.plans import SubscriptionPlan
from models.referral_users import ReferralUser
from datetime import datetime
import pytz

class ReferralUserPersistence:
    def __init__(self, db: Session):
        self.db = db
        
    def get_referral_users(self, user_id, search_term=None, start_date=None, end_date=None, offset=0, limit=10):
        query = self.db.query(
            ReferralUser.created_at.label('referral_created_at'),
            Users.company_name,
            Users.email,
            ReferralPayouts.created_at.label('payout_created_at'),
            ReferralPayouts.status.label('payout_status'),
            UserSubscriptions.status.label('subscription_status'),
            SubscriptionPlan.title.label('subscription_plan_title')
        )\
            .outerjoin(Users, Users.id == ReferralUser.user_id)\
            .outerjoin(Partner, Partner.user_id == Users.id)\
            .outerjoin(ReferralPayouts, ReferralPayouts.user_id == ReferralUser.user_id)\
            .outerjoin(UserSubscriptions, UserSubscriptions.id == Users.current_subscription_id)\
            .outerjoin(SubscriptionPlan, SubscriptionPlan.id == UserSubscriptions.plan_id)\
            .filter(Users.id == user_id)
        
        if search_term:
            query = query.filter(
                or_(
                    Users.name.ilike(f'{search_term}%'),
                    Users.company_name.ilike(f'{search_term}%')
                )
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
        
        total_count = query.count()
        result = query.offset(offset).limit(limit).all()
        return result, total_count
