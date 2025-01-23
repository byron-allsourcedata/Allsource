import logging
from urllib.parse import unquote
from persistence.user_persistence import UserPersistence
from persistence.partners_persistence import PartnersPersistence
from schemas.accounts import AccountResponse, AccountsObjectResponse, AccountUserData
from datetime import datetime
from persistence.referral_user import ReferralUserPersistence
from persistence.plans_persistence import PlansPersistence
from enums import SendgridTemplate

logger = logging.getLogger(__name__)


class AccountsService:

    def __init__(self,
        referral_user_persistence: ReferralUserPersistence,
        user_persistence: UserPersistence,
        partner_persistence: PartnersPersistence):
        self.referral_user_persistence = referral_user_persistence
        self.user_persistence = user_persistence
        self.partner_persistence = partner_persistence
        

    def get_partner_accounts(self, id, search, start_date, end_date, page, rowsPerPage, order_by, order):
        offset = page * rowsPerPage
        limit = rowsPerPage

        search_term = f"%{search}%" if search else None

        accounts, total_count = self.referral_user_persistence.get_referral_users(
            user_id=id,
            search_term=search_term,
            start_date=start_date,
            end_date=end_date,
            offset=offset,
            limit=limit,
            order_by=order_by, 
            order=order
        )

        return {"items": accounts, "totalCount": total_count}
    
    def get_partner_by_id_accounts(self, id, search, start_date, end_date, page, rowsPerPage, order_by, order):
        partner = self.partner_persistence.get_partner_by_id(id)
        return self.get_partner_accounts(partner.user_id, search, start_date, end_date, page, rowsPerPage, order_by, order)

    
    def get_admin_accounts(self, search, start_date, end_date, page, rows_per_page, order_by, order):
        offset = page * rows_per_page
        limit = rows_per_page
        
        search_term = f"%{search}%" if search else None
        accounts, total_count = self.user_persistence.get_accounts(
            search_term, start_date, end_date, offset, limit, order_by, order
        )
    
        return {"items": accounts, "totalCount": total_count}
