from uuid import UUID
from fastapi import APIRouter, Response

from auth_dependencies import AuthUser
from domains.premium_sources.exceptions import PremiumSourceNotFound
from domains.premium_sources.premium_sources_payments.exceptions import (
    DeductionNotFound,
    MultiplePremiumSourceTransactionsError,
)
from domains.premium_sources.premium_sources_payments.service import (
    PremiumSourcesPaymentsService,
)
from domains.users.exceptions import UserNotFound
from domains.users.users_funds.exception import (
    InsuffientFunds,
    MultipleUsersUpdated,
)

router = APIRouter()


@router.post("/unlock")
async def unlock_premium_source(
    user: AuthUser,
    premium_source_id: UUID,
    premium_source_payments: PremiumSourcesPaymentsService,
):
    user_id = user["id"]

    #  Raises `UserNotFound` \n
    #     Raises `PremiumSourceNotFound` \n
    #     Raises `DeductionNotFound` \n
    #     Raises `MultipleTransactionsError` \n
    #     Raises `InsuffientFunds` \n
    #     Raises `MultipleUsersUpdated`
    try:
        premium_source_payments.charge_for_premium_source(
            user_id=user_id,
            premium_source_id=premium_source_id,
        )
    except UserNotFound:
        pass
    except PremiumSourceNotFound:
        return Response(
            status_code=404, content="Premium source does not exist"
        )
    except InsuffientFunds:
        pass
    except MultipleUsersUpdated:
        pass
    except MultiplePremiumSourceTransactionsError:
        pass
    except DeductionNotFound:
        pass
