import logging
from fastapi import HTTPException
from models.partners_invitations import ParntersInvitations
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
        accounts_persistence: ParntersInvitationsPersistence):
        self.accounts_persistence = accounts_persistence
        # self.default_user = {
        #     "full_name": "Default User",
        #     "email": "default@example.com",
        #     "source_platform": "N/A",
        #     "created_at": datetime.strptime("1880-12-19 12:54:55", "%Y-%m-%d %H:%M:%S"),
        # }

    # def get_user_info(self, id):
    #     if id is not None:
    #         return self.user_persistence_service.get_user_by_id(id)
    #     else:
    #         return self.default_user


    def get_accounts_by_id(self, id):
        partners = self.accounts_persistence.get_accounts_by_partner_id(id)

        return [
            self.domain_mapped(partner)
            for i, partner in enumerate(partners)
        ]
        # result = []
        # for partner in partners:
        #     user_id = partner.user_id
        #     user = self.get_user_info(user_id)
        #     result.append(self.domain_mapped(partner, user))

        # return result


    def domain_mapped(self, account: ParntersInvitations):
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