import logging
from urllib.parse import unquote
from models.partners_users_invitation import ParntersUsersInvitation
from persistence.user_persistence import UserPersistence
from persistence.partners_persistence import PartnersPersistence
from persistence.partners_invations_persistence import ParntersInvitationsPersistence
from schemas.accounts import AccountResponse
from datetime import datetime
from services.sendgrid import SendgridHandler
from enums import SendgridTemplate

logger = logging.getLogger(__name__)


class AccountsService:

    def __init__(self,
        accounts_persistence: ParntersInvitationsPersistence, partners_persistence: PartnersPersistence):
        self.accounts_persistence = accounts_persistence
        self.partners_persistence = partners_persistence


    def get_accounts(self, id: int, email: str):
        try:
            if id:
                accounts = self.accounts_persistence.get_accounts_by_partner_id(id)
            else:
                decoded_email = unquote(email)
                partner = self.partners_persistence.get_partner_by_email(decoded_email)
                if not partner:
                    logger.debug("Account not found", e)
                    return {"status": False, "error":{"code": 404, "message": "Account data not found"}} 
                accounts = self.accounts_persistence.get_accounts_by_partner_id(partner.id)
            
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