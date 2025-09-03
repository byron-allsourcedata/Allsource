from uuid import UUID

from pydantic import BaseModel

from config.util import getenv
from resolver import injectable


from datetime import datetime, timedelta, timezone
import jwt

JWT_SECRET = getenv("AUTH_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 5


class InvalidTokenError(Exception):
    pass


class DownloadToken(BaseModel):
    user_id: int
    premium_source_id: UUID

    def encode(self) -> str:
        payload = {
            "user_id": self.user_id,
            "premium_source_id": str(self.premium_source_id),
            "exp": datetime.now(timezone.utc)
            + timedelta(minutes=JWT_EXPIRE_MINUTES),
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @classmethod
    def decode(cls, token: str):
        try:
            try:
                payload = jwt.decode(
                    token, JWT_SECRET, algorithms=[JWT_ALGORITHM]
                )
            except jwt.PyJWTError as e:
                raise ValueError(f"Invalid token: {e}")

            if type(payload) is not dict:
                raise InvalidTokenError

            return cls(
                user_id=payload["user_id"],
                premium_source_id=UUID(payload["premium_source_id"]),
            )
        except Exception as e:
            raise InvalidTokenError from e


@injectable
class DownloadTokenService:
    def __init__(self) -> None:
        pass

    def create(self, user_id: int, premium_source_id: UUID) -> DownloadToken:
        return DownloadToken(
            user_id=user_id, premium_source_id=premium_source_id
        )
