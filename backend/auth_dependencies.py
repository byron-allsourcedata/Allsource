import logging
from datetime import datetime
from fastapi import Depends, HTTPException, Header, status
from jose import JWTError, jwt
from config.auth import AuthConfig
from enums import UserAuthorizationStatus
from exceptions import InvalidToken
from persistence.user_persistence import UserDict, UserPersistence

from typing import Annotated

from schemas.auth_token import Token

logger = logging.getLogger(__name__)


def parse_jwt_data(Authorization: Annotated[str, Header()]) -> Token:
    access_token = Authorization.replace("Bearer ", "")
    try:
        data = jwt.decode(
            access_token,
            AuthConfig.secret_key,
            algorithms=["HS256"],
            audience="Filed-Client-Apps",
        )
        if datetime.utcnow() > datetime.fromtimestamp(data["exp"]):
            raise InvalidToken
        return Token(**data)
    except JWTError:
        raise InvalidToken


def check_user_authentication(
    Authorization: Annotated[str, Header()],
    user_persistence_service: UserPersistence,
) -> Token:
    user_data = parse_jwt_data(Authorization)
    user = user_persistence_service.get_user_by_id(user_data.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"status": "NOT_FOUND"},
        )

    team_owner_id = user.get("team_owner_id")

    if team_owner_id is not None:
        user["id"] = team_owner_id

    print(user_data)

    if hasattr(user_data, "team_member_id") and user_data.team_member_id:
        team_memer = user_persistence_service.get_user_team_member_by_id(
            user_data.team_member_id
        )
        if team_memer.get("team_owner_id") is None or team_memer.get(
            "team_owner_id"
        ) != user.get("id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "status": UserAuthorizationStatus.TEAM_TOKEN_EXPIRED.value
                },
            )
        user["team_member"] = team_memer
    return user


def maybe_check_user_authentication(
    Authorization: Annotated[str, Header()],
    user_persistence_service: UserPersistence,
) -> Token | None:
    try:
        return check_user_authentication(
            Authorization, user_persistence_service
        )
    except HTTPException:
        return None


def check_unlimited_user(
    user: Annotated[UserDict, Depends(check_user_authentication)],
) -> UserDict:
    if user.get("current_subscription_id") is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"status": UserAuthorizationStatus.NEED_PAY_BASIC.value},
        )
    return user


AuthUser = Annotated[UserDict, Depends(check_user_authentication)]
MaybeAuthUser = Annotated[
    UserDict | None, Depends(maybe_check_user_authentication)
]
UnlimitedUser = Annotated[UserDict, Depends(check_unlimited_user)]
