import logging
from urllib.parse import unquote
from models.partners_users_invitation import ParntersUsersInvitation
from persistence.user_persistence import UserPersistence
from persistence.partners_persistence import PartnersPersistence
from persistence.partners_invations_persistence import ParntersInvitationsPersistence
from schemas.accounts import AccountResponse, AccountsObjectResponse, AccountUserData
from datetime import datetime
from persistence.referral_user import ReferralUserPersistence
from persistence.plans_persistence import PlansPersistence
from enums import SendgridTemplate

logger = logging.getLogger(__name__)


class AccountsService:

    def __init__(self,
        accounts_persistence: ParntersInvitationsPersistence,
        referral_user_persistence: ReferralUserPersistence,
        partners_persistence: PartnersPersistence,
        user_persistence: UserPersistence):
        self.accounts_persistence = accounts_persistence
        self.partners_persistence = partners_persistence
        self.user_persistence = user_persistence
        self.referral_user_persistence = referral_user_persistence
        

    def get_user_info(self, user_id=None, partner=None):
        user_data = {}
        user_data["payment_date"] = None
        user_data["reward_amount"] = None
        user_data["reward_status"] = None
        user_data["reward_payout_date"] = None
        user_data["sources"] = "Others"
        if partner.master_id is not None:
            master_partner = self.partners_persistence.get_asset_by_id(partner.master_id)
            if (master_partner and master_partner.company_name):
                user_data["sources"] = master_partner.company_name
        # if user_id is not None:
            # self.user_persistence.get_user_by_id(user_id)
            # user_data["payment_date"] = datetime.strptime("1880-12-19 12:54:55", "%Y-%m-%d %H:%M:%S")
        return user_data

    def get_accounts(self, user: dict, search, start_date, end_date, page, rowsPerPage) -> AccountsObjectResponse:
        offset = page * rowsPerPage
        limit = rowsPerPage
        accounts, total_count = self.referral_user_persistence.get_referral_users(
            user_id=user.get('id'),
            search_term=search,
            start_date=start_date,
            end_date=end_date,
            offset=offset,
            limit=limit
        )

        return {"items": accounts, "totalCount": total_count}
    
    
    def get_admin_accounts(self, search, start_date, end_date, page, rows_per_page, order_by, order):
        offset = page * rows_per_page
        limit = rows_per_page
        
        search_term = f"%{search}%" if search else None
        accounts, total_count = self.user_persistence.get_accounts(
            search_term, start_date, end_date, offset, limit, order_by, order
        )
    
        return {"items": accounts, "totalCount": total_count}


    def domain_mapped(self, account: ParntersUsersInvitation, user: AccountUserData):
        return AccountResponse(
            id=account.id,
            account_name=account.name,
            email=account.email,
            join_date=account.join_date,
            plan_amount=user["plan_amount"],
            reward_status=account.status.capitalize(),
            reward_amount=user["reward_amount"],
            reward_payout_date=user["payment_date"],
            last_payment_date=user["payment_date"],
            status=account.status.capitalize()
        ).model_dump()