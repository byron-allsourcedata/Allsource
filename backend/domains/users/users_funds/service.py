from domains.users.exceptions import UserNotFound
from domains.users.users_funds.exception import (
    InsufficientFunds,
    MultipleUsersUpdated,
)
from resolver import injectable

from .repo import UsersFundsPersistence


@injectable
class UserFundsService:
    def __init__(self, repo: UsersFundsPersistence) -> None:
        self.repo = repo

    def premium_funds(self, user_id: int) -> int | None:
        """
        limit as int or None if unlimited

        Raises `UserNotFound`
        """
        return self.repo.get_premium_source_funds(user_id)

    def deduct_premium_funds(self, user_id: int, amount: int):
        """
        raises InsufficientFunds \n
        raises UserNotFound \n
        raises MultipleUsersUpdated
        """
        premium_source_funds = self.repo.get_premium_source_funds(user_id)

        if premium_source_funds is None:
            # unlimited premium source funds
            return

        if premium_source_funds < amount:
            raise InsufficientFunds()

        rows_updated = self.repo.deduct_funds(user_id, amount)

        if rows_updated != 1:
            raise UserNotFound()

        if rows_updated > 1:
            raise MultipleUsersUpdated(amount)
