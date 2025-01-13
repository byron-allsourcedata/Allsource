import logging
from urllib.parse import unquote
from models.partners_users_invitation import ParntersUsersInvitation
from persistence.user_persistence import UserPersistence
from persistence.partners_persistence import PartnersPersistence
from persistence.partners_invations_persistence import ParntersInvitationsPersistence
from schemas.accounts import AccountResponse, AccountsObjectResponse, AccountUserData
from datetime import datetime
from persistence.plans_persistence import PlansPersistence
from enums import SendgridTemplate

logger = logging.getLogger(__name__)


class AccountsService:

    def __init__(self,
        accounts_persistence: ParntersInvitationsPersistence, 
        partners_persistence: PartnersPersistence):
        self.accounts_persistence = accounts_persistence
        self.partners_persistence = partners_persistence

    def get_user_info(self, user_id = None):
        user_data = {}
        user_data["plan_amount"] = "$4000"
        user_data["reward_amount"] = "$4000"
        user_data["payment_date"] = None
        # if user_id is not None:
            # self.user_persistence.get_user_by_id(user_id)
            # user_data["payment_date"] = datetime.strptime("1880-12-19 12:54:55", "%Y-%m-%d %H:%M:%S")
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
                    return {"status": False, "error": {"code": 404, "message": "Account data not found"}}
                id = partner.id

            accounts = self.accounts_persistence.get_accounts(
                partner_id=id,
                search_term=search,
                start_date=start_date,
                end_date=end_date,
                offset=offset,
                limit=limit
            )
            total_count = self.accounts_persistence.get_total_count(partner_id=id, search_term=search)

            result = []
            for account in accounts:
                user = self.get_user_info(account.user_id)
                result.append(self.domain_mapped(account, user))

            return {"status": True, "data": {"items": result, "totalCount": total_count}}

        except Exception as e:
            logger.debug("Error getting account data", e)
            return {"status": False, "error": {"code": 500, "message": f"Unexpected error during getting: {str(e)}"}}
 


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