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
        partners_persistence: PartnersPersistence):
        self.accounts_persistence = accounts_persistence
        self.partners_persistence = partners_persistence
        self.referral_user_persistence = referral_user_persistence
        

    def get_accounts(self, user: dict, search, start_date, end_date, page, rowsPerPage):
        offset = page * rowsPerPage
        limit = rowsPerPage
        accounts_data, total_count = self.referral_user_persistence.get_referral_users(
            user_id=user.get('id'),
            search_term=search,
            start_date=start_date,
            end_date=end_date,
            offset=offset,
            limit=limit
        )

        return {"items": accounts_data, "totalCount": total_count}

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