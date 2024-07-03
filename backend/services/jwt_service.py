from datetime import datetime, timedelta
from passlib.context import CryptContext
from typing import Dict, Mapping, Union
from jose import jwt
from ..config.auth import AuthConfig
from ..exceptions import TokenError
from ..schemas.auth_token import Token

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def decode_jwt_from_headers(headers: dict) -> Mapping:
    """
    Extracts Authorization Bearer JWT from request header and decodes it.
    Works for both Flask and FastAPI.
    :param headers: header dictionary (Flask) or Header Object (FastAPI)
    :return: decoded jwt data
    """
    return decode_jwt_data(headers.get("Authorization", ""))


def decode_jwt_data(token: str) -> Union[Mapping, Dict]:
    """
    Decodes data from JWT.
    :param token: Bearer JWT
    :return: decoded jwt data
    """
    try:
        token = token.replace("Bearer ", "")
    except AttributeError:
        raise TokenError
    jwt_data = jwt.decode(token, AuthConfig.secret_key, options={"verify_signature": False}, audience="Filed-Client-Apps",
                          algorithms=["HS256"])
    return jwt_data


def create_access_token(token: Token, expires_delta: Union[timedelta, None] = None):
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=AuthConfig.expire_days)

        if isinstance(token, dict):
            token_dict = token
        else:
            token_dict = token.__dict__

        token_dict.update({"exp": int(expire.timestamp())})
        encoded_jwt = jwt.encode(token_dict, AuthConfig.secret_key, AuthConfig.algorithm)
        return encoded_jwt


def get_password_hash(password):
    return pwd_context.hash(password)
