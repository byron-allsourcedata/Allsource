from sqlalchemy.orm import Session
from models.referral_payouts import ReferralPayouts
from datetime import datetime, timezone
from sqlalchemy import extract, or_, func, case, and_, asc, desc
from models.referral_users import ReferralUser
from models.partner import Partner
from models.users import Users
from models.referral_discount_codes import ReferralDiscountCode
import math
import pytz

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
            
    def update_payouts_partner_confirmation_status(self, referral_payout_id: int, confirmation_status, text=None):
        referral_payout = self.db.query(ReferralPayouts).filter(ReferralPayouts.id == referral_payout_id).first()
        if not referral_payout:
            return 'PAYOUTS_PARTNER_NOT_FOUND'
        
        if text:
            referral_payout.comment = text
            
        referral_payout.confirmation_status = confirmation_status
        
        self.db.commit()
        return 'SUCCESS'
    
    def update_payouts_partner_status(self, referral_payout_id: int, status):
        referral_payout = self.db.query(ReferralPayouts).filter(ReferralPayouts.id == referral_payout_id).first()
        if not referral_payout:
            return 'PAYOUTS_PARTNER_NOT_FOUND'
            
        referral_payout.status = status
        referral_payout.paid_at = datetime.now(timezone.utc)
        
        self.db.commit()
        return 'SUCCESS'
    
    def get_referral_payouts_by_parent_id(self, parent_id):
        return self.db.query(ReferralPayouts).filter(ReferralPayouts.parent_id == parent_id).all()

    def get_referral_payouts_by_parent_ids(self, user_ids):
        return self.db.query(ReferralPayouts).filter(ReferralPayouts.parent_id.in_(user_ids)).all()
    
    def get_all_referral_payouts(self, is_master, year=None, month=None, from_date=None, to_date=None, sort_by=None, sort_order=None):
        query = self.db.query(ReferralPayouts)\
            .outerjoin(Partner, Partner.user_id == ReferralPayouts.parent_id)\
            .filter(Partner.is_master == is_master)
        
        if year:
            query = query.filter(extract("year", ReferralPayouts.created_at) == year)
        
        if month:
            query = query.filter(extract("month", ReferralPayouts.created_at) == month)

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
            query = query.filter(
                and_(
                    ReferralPayouts.paid_at >= start_date,
                    ReferralPayouts.paid_at <= end_date
                )
            )
        
        return query.order_by(ReferralPayouts.paid_at.desc()).all()
    
    def get_referral_payouts_by_partner_id(self, year, month, partner_id, search_query, reward_type, from_date, to_date, sort_by, sort_order):
        query = self.db.query(
            Partner.id,
            ReferralPayouts.id,
            ReferralPayouts.reward_amount,
            ReferralPayouts.paid_at,
            ReferralPayouts.plan_amount,
            ReferralPayouts.confirmation_status,
            ReferralPayouts.status,
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
        if reward_type == 'master_partner':
            query = query.filter(ReferralPayouts.reward_type == 'master_partner')
        else:
            query = query.filter(ReferralPayouts.reward_type == 'partner')
            
        if search_query:
            filters = [
                Users.company_name.ilike(f'{search_query}%'),
                Users.email.ilike(f'{search_query}%'),
            ]
            query = query.filter(or_(*filters))

        if from_date and to_date:
            start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC)
            end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC)
            query = query.filter(
                and_(
                    ReferralPayouts.created_at >= start_date,
                    ReferralPayouts.created_at <= end_date
                )
            )
        
        if year:
            query = query.filter(extract("year", ReferralPayouts.created_at) == year)
        
        if month:
            query = query.filter(extract("month", ReferralPayouts.created_at) == month)

        sort_options = {
            'join_date': Users.created_at,
        }
        if sort_by:
            sort_column = sort_options[sort_by]
            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            elif sort_order == 'desc':
                query = query.order_by(desc(sort_column))

        return query.all()
    
    def get_overview_payout_history(self, page, per_page, from_date, to_date):
        start_date = datetime.fromtimestamp(from_date, tz=pytz.UTC) if from_date else None
        end_date = datetime.fromtimestamp(to_date, tz=pytz.UTC) if to_date else None
        paid_alias = case((ReferralPayouts.status == 'paid', ReferralPayouts.reward_amount), else_=0)
        query = (
            self.db.query(
                func.to_char(ReferralPayouts.paid_at, 'YYYY-MM').label('year_month'),
                func.sum(ReferralPayouts.plan_amount).label('total_revenue'),
                func.sum(ReferralPayouts.reward_amount).label('total_reward_amount'),
                func.sum(paid_alias).label('total_rewards_paid')
            )
            .filter(ReferralPayouts.paid_at.isnot(None))
        )
        if start_date and end_date:
            query = query.filter(
                ReferralPayouts.paid_at.between(start_date, end_date)
                )
        query = query.group_by('year_month').order_by('year_month')
        offset = (page - 1) * per_page
        result = query.limit(per_page).offset(offset).all()
        count = query.count()
        max_page = math.ceil(count / per_page)
        return result, count, max_page