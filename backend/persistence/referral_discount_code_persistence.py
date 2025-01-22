from sqlalchemy.orm import Session
from models.referral_users import ReferralUser
from models.users import Users
from datetime import datetime, timezone
from enums import ProgramType
from models.referral_discount_codes import ReferralDiscountCode


class ReferralDiscountCodesPersistence:
    def __init__(self, db: Session):
        self.db = db
    
    def get_referral_discount_codes(self):
        return self.db.query(ReferralDiscountCode).all()
    
    def get_discount_code(self, user_id):
        return self.db.query(ReferralDiscountCode.coupon).join(ReferralUser, ReferralUser.discount_code_id == ReferralDiscountCode.id).where(ReferralUser.user_id == user_id).scalar()
    
    def get_referral_discount_code_by_id(self, discount_code_id):
        return self.db.query(ReferralDiscountCode).where(ReferralDiscountCode.id == discount_code_id).first()
    
    def save_referral_users(self, user_id, parent_user_id, discount_code_id):
        parent_user = self.db.query(Users).where(Users.id == parent_user_id).first()
        referral_program_type = ProgramType.PARTNER.value if parent_user.is_partner else ProgramType.REFERRAL.value
        referral_user = ReferralUser(
            user_id=user_id,
            parent_user_id=parent_user_id,
            discount_code_id=discount_code_id or None,
            referral_program_type=referral_program_type,
            created_at=datetime.now(timezone.utc)
        )
        
        self.db.add(referral_user)
        self.db.commit()

    def verify_user_relationship(self, parent_id: int, user_id: int) -> bool:
        return self.db.query(ReferralUser).filter(
            ReferralUser.parent_user_id == parent_id,
            ReferralUser.user_id == user_id
        ).first() is not None