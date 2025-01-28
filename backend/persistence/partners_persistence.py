from models.partner import Partner
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import case
import os
from sqlalchemy import or_, func
from typing import Optional, Tuple
from datetime import datetime, timezone
from models.referral_payouts import ReferralPayouts
from models.users import Users
from models.plans import SubscriptionPlan
from models.referral_users import ReferralUser
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


    def get_partners(self, is_master, search_term=None, start_date=None, end_date=None, offset=None, limit=None):
        MasterPartner = aliased(Partner)
        query = self.db.query(
            Partner.id, 
            Partner.email,
            Partner.company_name,
            Partner.user_id,
            Partner.name,
            Partner.join_date,
            Partner.is_master,
            Partner.commission,
            Partner.status,
            Partner.is_active,
            ReferralPayouts.plan_amount.label("reward_amount"),
            ReferralPayouts.paid_at.label("reward_payout_date"),
            ReferralPayouts.status.label("reward_status"),
            ReferralPayouts.created_at.label("last_payment_date"),
            func.count(ReferralUser.parent_user_id).label("count_accounts"),
            case(
                (Partner.master_id > 0, MasterPartner.company_name),
                else_="Direct"
            ).label("source")
            ).outerjoin(ReferralPayouts, ReferralPayouts.parent_id == Partner.user_id
            ).outerjoin(ReferralUser, ReferralUser.parent_user_id == Partner.user_id
            ).outerjoin(MasterPartner, MasterPartner.id == Partner.master_id         
            ).filter(Partner.is_master == is_master
            ).group_by(
                Partner.id, 
                Partner.email,
                Partner.company_name,
                Partner.user_id,
                Partner.name,
                Partner.join_date,
                Partner.is_master,
                Partner.commission,
                Partner.status,
                Partner.is_active,
                ReferralPayouts.plan_amount,
                ReferralPayouts.paid_at,
                ReferralPayouts.status,
                ReferralPayouts.created_at,
                MasterPartner.company_name,
                Partner.master_id
            )

        if search_term:
            query = query.filter(
                (Partner.name.ilike(search_term)) | (Partner.email.ilike(search_term))
            )

        if start_date:
            query = query.filter(Partner.join_date >= start_date)

        if end_date:
            end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(Partner.join_date <= end_date)

        results = [row._asdict() for row in query.offset(offset).limit(limit).all()]
        
        return results, query.count()


    def get_partners_by_partner_id(self, id, start_date, end_date, offset, limit, search_term=None):
        MasterPartner = aliased(Partner)
        query = self.db.query(
            Partner.id,
            Partner.user_id,
            Partner.email,
            Partner.company_name,
            Partner.user_id,
            Partner.name,
            Partner.join_date,
            Partner.is_master,
            Partner.commission,
            Partner.status,
            Partner.is_active,
            ReferralPayouts.plan_amount.label("reward_amount"),
            ReferralPayouts.paid_at.label("reward_payout_date"),
            ReferralPayouts.status.label("reward_status"),
            ReferralPayouts.created_at.label("last_payment_date"),
            func.count(ReferralUser.parent_user_id).label("count_accounts"),
            case(
                (Partner.master_id > 0, MasterPartner.company_name),
                else_="Direct"
            ).label("source")
            ).outerjoin(ReferralPayouts, ReferralPayouts.parent_id == Partner.user_id
            ).outerjoin(ReferralUser, ReferralUser.parent_user_id == Partner.user_id
            ).outerjoin(MasterPartner, MasterPartner.id == Partner.master_id         
            ).filter(Partner.master_id == id
            ).group_by(
                Partner.id, 
                Partner.email,
                Partner.company_name,
                Partner.user_id,
                Partner.name,
                Partner.join_date,
                Partner.is_master,
                Partner.commission,
                Partner.status,
                Partner.is_active,
                ReferralPayouts.plan_amount,
                ReferralPayouts.paid_at,
                ReferralPayouts.status,
                ReferralPayouts.created_at,
                MasterPartner.company_name,
                Partner.master_id
            )
        
        if search_term:
            query = query.filter(
                (Partner.name.ilike(search_term)) | (Partner.email.ilike(search_term))
            )
        
        if start_date:
            query = query.filter(Partner.join_date >= start_date)
        if end_date:
            end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(Partner.join_date <= end_date)
        
        results = [row._asdict() for row in query.offset(offset).limit(limit).all()]
        
        return results, query.count()
        


    def get_partner_by_id(self, partner_id):
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


    def update_partner(self, partner_id: int, **kwargs) -> Tuple[Optional[Partner], bool]:
        partner = self.get_partner_by_id(partner_id)

        commission_changed = False

        for key, value in kwargs.items():
            if hasattr(partner, key) and value is not None:
                if getattr(partner, key) != value:
                    setattr(partner, key, value)
                    if key == "commission":
                        commission_changed = True

        self.db.commit()
        self.db.refresh(partner)

        return partner, commission_changed
    
    def get_partner_by_master(self, parent_user_id, partner_id):
        MasterPartner = aliased(Partner)
        return self.db.query(Partner).join(MasterPartner, MasterPartner.id == Partner.master_id)\
            .filter(
            Partner.id == partner_id,
            MasterPartner.user_id == parent_user_id
        ).first()


    def update_partner_by_email(self, email: int, **kwargs) -> Optional[Partner]:
        partner = self.get_partner_by_email(email)

        for key, value in kwargs.items():
            if hasattr(partner, key) and value is not None:
                setattr(partner, key, value)

        self.db.commit()
        self.db.refresh(partner)
        if partner.is_master == True:
            self.add_default_referral_user(partner.user_id)
            
        return partner

    def add_default_referral_user(self, parent_id):
        default_email = os.getenv('DEFAULT_USER_FOR_REFERRAL_USER')
        if default_email:
            default_user = self.db.query(Users).filter(Users.email == default_email).first()
            if default_user:
                referral = ReferralUser(
                        user_id=default_user.id,
                        parent_user_id=parent_id,
                        referral_program_type='partner',
                        created_at=datetime.now(timezone.utc)
                    )
                self.db.add(referral)
                self.db.commit()


    def terminate_partner(self, partner_id):
        self.db.query(Partner).filter(Partner.id == partner_id).delete()
        self.db.commit()


    def create_partner(self, creating_data: dict) -> Optional[Partner]:
        partner = Partner(
            commission=creating_data["commission"],
            token=creating_data["token"],
            email=creating_data["email"],
            name=creating_data["name"],
            company_name=creating_data["company_name"],
            is_master=creating_data["is_master"],
            status=creating_data.get('status'),
            user_id=creating_data.get('user_id'),
            join_date=creating_data.get('join_date')
        )

        if "master_id" in creating_data and creating_data["master_id"] is not None:
            partner.master_id = creating_data["master_id"]

        self.db.add(partner)
        self.db.commit()
        self.db.refresh(partner)
        return partner