import logging
from urllib.parse import unquote
from models.partners_users_invitation import ParntersUsersInvitation
from persistence.user_persistence import UserPersistence
from persistence.partners_persistence import PartnersPersistence
from persistence.partners_invations_persistence import ParntersInvitationsPersistence
from schemas.accounts import AccountResponse, AccountsObjectResponse
from datetime import datetime
from services.sendgrid import SendgridHandler
from enums import SendgridTemplate

logger = logging.getLogger(__name__)


class AccountsService:

    def __init__(self,
        accounts_persistence: ParntersInvitationsPersistence, partners_persistence: PartnersPersistence):
        self.accounts_persistence = accounts_persistence
        self.partners_persistence = partners_persistence

    def get_user_info(self, user_id: int):
        user_data = {}
        user_data["subscription"] = "--"
        user_data["payment_date"] = None
        if user_id is not None:
            # self.user_persistence.get_user_by_id(user_id)
            # user_data["payment_date"] = datetime.strptime("1880-12-19 12:54:55", "%Y-%m-%d %H:%M:%S")
            subsciption = self.plans_persistence.get_current_plan(user_id)
            if (subsciption and subsciption.title):
                user_data["subscription"] = subsciption.title
        return user_data


    def get_accounts(self, id, email, search, start_date, end_date, page, rowsPerPage) -> AccountsObjectResponse:
        offset = page * rowsPerPage
        limit = rowsPerPage

        try:
            if not id:
                decoded_email = unquote(email)
                partner = self.partners_persistence.get_partner_by_email(decoded_email)
                if not partner:
                    logger.debug("Account not found", e)
                    return {"status": False, "error":{"code": 404, "message": "Account data not found"}} 
                id = partner.id

            if search is None:
                accounts = self.accounts_persistence.get_accounts_by_partner_id(id, start_date, end_date, offset, limit)
                total_count = self.accounts_persistence.get_total_count(id)
            else:
                search_term = f"%{search}%"
                accounts = self.accounts_persistence.get_accounts_by_partner_id(id, search_term, start_date, end_date, offset, limit)
                total_count = self.accounts_persistence.get_total_count_search(id, search_term)
                      
            result = []
            for account in accounts:
                result.append(self.domain_mapped(account))
            return {"status": True, "data": result}
        except Exception as e:
            logger.debug("Error getting account data", e)
            return {"status": False, "error":{"code": 500, "message": f"Unexpected error during getting: {str(e)}"}} 


    def domain_mapped(self, account: ParntersUsersInvitation):
        return AccountResponse(
            id=account.id,
            account_name=account.name,
            email=account.email,
            join_date="1880-12-19 12:54:55",
            plan_amount="Basic",
            reward_status=account.status,
            reward_amount="$4000",
            reward_payout_date="1880-12-19 12:54:55",
            last_payment_date="1880-12-19 12:54:55",
            status=account.status,
        ).model_dump()