from typing import Self
from pydantic import BaseModel

from persistence.user_persistence import UserDict


class InvitationUserInfo(BaseModel):
    id: int
    full_name: str
    company_name: str | None

    @classmethod
    def from_user_dict(cls, user_dict: UserDict) -> Self:
        return cls(
            id=user_dict["id"],
            full_name=user_dict["full_name"],
            company_name=user_dict["company_name"],
        )
