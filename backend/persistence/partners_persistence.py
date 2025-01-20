from models.partner import Partner
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
from datetime import datetime, timedelta
from models.referral_payouts import ReferralPayouts
from models.users import Users
from enums import ConfirmationStatus, PayoutsStatus

class PartnersPersistence:

    def __init__(self, db: Session):
        self.db = db

    def get_partners_by_user_ids(self, user_ids, search_query=None):
        query = self.db.query(Partner).filter(Partner.user_id.in_(user_ids))
        if search_query:
            filters = [
                Partner.email.ilike(f'{search_query}%'),
                Partner.company_name.ilike(f'{search_query}%'),
            ]
            query = query.filter(or_(*filters))
            
        return query.all()
    
    def get_stripe_account_and_total_reward_by_partner_id(self, partner_id):
        return self.db.query(
            Users.connected_stripe_account_id,
            func.sum(ReferralPayouts.reward_amount).label('total_reward'),
            func.array_agg(ReferralPayouts.id).label('payout_ids')
        )\
        .join(Partner, Partner.user_id == Users.id)\
        .join(ReferralPayouts, ReferralPayouts.parent_id == Partner.user_id)\
        .filter(
            Partner.id == partner_id,
            ReferralPayouts.confirmation_status == ConfirmationStatus.APPROVED.value,
            ReferralPayouts.status == PayoutsStatus.PENDING.value
        )\
        .group_by(Users.connected_stripe_account_id)\
        .first()

    def get_partners(self, isMaster, search_term, start_date, end_date, offset, limit):
        query = self.db.query(Partner).filter(Partner.is_master == isMaster)

        if search_term:
            query = query.filter(
                (Partner.name.ilike(search_term)) | (Partner.email.ilike(search_term))
            )

        if start_date:
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Partner.join_date >= start_date)

        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
            else:
                end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(Partner.join_date <= end_date)

        return query.offset(offset).limit(limit).all()

    

    def get_partners_by_partners_id(self, id, start_date=None, end_date=None, offset=None, limit=None):
        query = self.db.query(Partner).filter(Partner.master_id == id)
        
        if start_date:
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Partner.join_date >= start_date)
        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
            else:
                end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(Partner.join_date <= end_date)
        
        if not offset and not limit:
            return query
        
        return query.offset(offset).limit(limit).all()

    


    def get_total_count(self, isMaster, search_term=None):
        query = self.db.query(Partner).filter(Partner.is_master == isMaster)

        if search_term:
            query = query.filter(
                (Partner.name.ilike(search_term)) | (Partner.email.ilike(search_term))
            )

        return query.count()
    
    def get_total_count_by_id(self, id, start_date, end_date):
        query = self.db.query(Partner).filter(Partner.master_id == id)

        if start_date:
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Partner.join_date >= start_date)
        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
            else:
                end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(Partner.join_date <= end_date)

        return query.count()



    def get_asset_by_id(self, partner_id):
        return self.db.query(Partner).filter(Partner.id == partner_id).first()
    

    def get_partner_by_email(self, email):
        return self.db.query(Partner).filter(Partner.email == email).first()
    
    def get_partner_by_user_id(self, user_id):
        return self.db.query(Partner).filter(Partner.user_id == user_id).first()
    

    def update_partner_info(self, email, fullName, company):
        partner = self.get_partner_by_email(email)
        if partner:
            partner.name = fullName
            partner.company_name = company
            self.db.commit()

    def update_partner(self, partner_id: int, **kwargs) -> Optional[Partner]:
        partner = self.get_asset_by_id(partner_id)

        if not partner:
            return None

        for key, value in kwargs.items():
            if hasattr(partner, key) and value is not None:
                setattr(partner, key, value)

        if "full_name" in kwargs and kwargs["full_name"] is not None:
            partner.name = kwargs["full_name"]
        if "company_name" in kwargs and kwargs["company_name"] is not None:
            partner.company_name = kwargs["company_name"]

        self.db.commit()
        self.db.refresh(partner)
        return partner
    

    def update_partner_by_email(self, email: int, **kwargs) -> Optional[Partner]:
        partner = self.get_partner_by_email(email)

        if not partner:
            return None

        for key, value in kwargs.items():
            if hasattr(partner, key) and value is not None:
                setattr(partner, key, value)

        self.db.commit()
        self.db.refresh(partner)
        return partner


    def terminate_partner(self, partner_id):
        self.db.query(Partner).filter(
            Partner.id == partner_id).delete()
        self.db.commit()


    def create_partner(self, creating_data: dict) -> Optional[Partner]:
        partner = Partner(
            commission=creating_data["commission"],
            token=creating_data["token"],
            email=creating_data["email"],
            name=creating_data["full_name"],
            company_name=creating_data["company_name"],
            is_master=creating_data["isMaster"]
        )

        if "masterId" in creating_data and creating_data["masterId"] is not None:
            partner.master_id = creating_data["masterId"]

        self.db.add(partner)
        self.db.commit()
        self.db.refresh(partner)
        return partner