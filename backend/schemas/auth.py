from typing import Optional, Union

from pydantic import BaseModel


class Token(BaseModel):
    account_state_id: Union[int, None] = None
    aud: str
    discovery_id: Union[int, None] = None
    exp: int = 0
    first_time_user: bool
    id: Optional[int]  # cannot be optional
    iss: Optional[str]
    parent_user_id: Union[int, None] = 0
    payment_status: Optional[int]
    permissions: Union[int, None]
    permissions_filed: Optional[str]
    phone_number: Optional[str]
    pid: Union[None, int] = None
    sub: Optional[str]
    sub_user: Union[None, bool]
    type: Optional[str]  # cannot be optional
    user_account_state: Optional[int]
    user_filed_id: int  # deprecated
    user_firstname: Optional[str]
    user_lastname: Optional[str]
    user_type: Optional[str]  # deprecated
    username: Optional[str]
    email: Optional[str]
