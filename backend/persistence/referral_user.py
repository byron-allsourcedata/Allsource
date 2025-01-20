from sqlalchemy.orm import Session
from models.referral_payouts import ReferralPayouts
from sqlalchemy import func, extract
from models.users import Users
from models.partner import Partner
from models.subscriptions import UserSubscriptions
from sqlalchemy import and_, or_, desc, asc, Integer
from models.referral_users import ReferralUser
from datetime import datetime
import pytz

class ReferralUserPersistence:
    def __init__(self, db: Session):
        self.db = db
        
    def get_referral_users(self, user_id, search_term, start_date, end_date, offset, limit, order_by, order):
        order_column = getattr(Users, order_by, Users.id)
        order_direction = asc(order_column) if order == "asc" else desc(order_column)

        query = self.db.query(
            Users.id,
            Users.full_name,
            Users.email,
            ReferralUser.created_at.label('join_date'),
            ReferralPayouts.created_at.label('last_payment_date'),
            ReferralPayouts.paid_at.label('reward_payout_date'),
            ReferralPayouts.status.label('reward_status'),
            ReferralPayouts.plan_amount,
            UserSubscriptions.status.label('subscription_status'),
        )\
            .outerjoin(Users, ReferralUser.user_id == Users.id)\
            .outerjoin(Partner, Partner.user_id == Users.id)\
            .outerjoin(ReferralPayouts, ReferralPayouts.user_id == Users.id)\
            .outerjoin(UserSubscriptions, UserSubscriptions.id == Users.current_subscription_id)\
            .filter(ReferralUser.parent_user_id == user_id)
        
        if search_term:
            query = query.filter(
                or_(
                    Users.full_name.ilike(search_term),
                    Users.email.ilike(search_term)
                )
            )

        if start_date:
            query = query.filter(ReferralUser.created_at >= start_date)
        if end_date:
            end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(ReferralUser.created_at <= end_date)
        
        query = query.order_by(order_direction)
        
        accounts = query.offset(offset).limit(limit).all()
    
        return [
            {
                "id": account[0],
                "account_name": account[1],
                "email": account[2],
                "join_date": account[3],
                "last_payment_date": account[4],
                "reward_payout_date": account[5],
                "reward_status": account[6].capitalize() if account[6] else "Inactive",
                "plan_amount": account[7] if account[7] else "--",
                "status": account[8].capitalize() if account[8] else "Inactive",
            }
            for account in accounts
        ], query.count()
    

    def get_referral_by_id_users(self, partner_id, search_term, start_date, end_date, offset, limit, order_by, order):
        order_column = getattr(Users, order_by, Users.id)
        order_direction = asc(order_column) if order == "asc" else desc(order_column)

        query = self.db.query(
            Users.id,
            Users.full_name,
            Users.email,
            ReferralUser.created_at.label('join_date'),
            ReferralPayouts.created_at.label('last_payment_date'),
            ReferralPayouts.paid_at.label('reward_payout_date'),
            ReferralPayouts.status.label('reward_status'),
            ReferralPayouts.plan_amount,
            UserSubscriptions.status.label('subscription_status'),
        )\
            .outerjoin(Users, ReferralUser.user_id == Users.id)\
            .outerjoin(Partner, Partner.user_id == Users.id)\
            .outerjoin(ReferralPayouts, ReferralPayouts.user_id == Users.id)\
            .outerjoin(UserSubscriptions, UserSubscriptions.id == Users.current_subscription_id)\
            .filter(ReferralUser.parent_user_id == Partner.user_id)\
            .filter(Partner.id == partner_id)
        
        if search_term:
            query = query.filter(
                or_(
                    Users.full_name.ilike(search_term),
                    Users.email.ilike(search_term)
                )
            )

        if start_date:
            query = query.filter(ReferralUser.created_at >= start_date)
        if end_date:
            end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(ReferralUser.created_at <= end_date)
        
        query = query.order_by(order_direction)
        
        accounts = query.offset(offset).limit(limit).all()
    
        return [
            {
                "id": account[0],
                "account_name": account[1],
                "email": account[2],
                "join_date": account[3],
                "last_payment_date": account[4],
                "reward_payout_date": account[5],
                "reward_status": account[6].capitalize() if account[6] else "Inactive",
                "plan_amount": account[7] if account[7] else "--",
                "status": account[8].capitalize() if account[8] else "Inactive",
            }
            for account in accounts
        ], query.count()
