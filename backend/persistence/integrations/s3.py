from typing import Optional, TypedDict
from uuid import UUID

from pydantic import BaseModel

from db_dependencies import Db
from resolver import injectable
from services.integrations.commonIntegration import User


@injectable
class S3IntegrationPersistence:
    def __init__(
        self,
        db: Db
    ):
        self.db = db

    def get_user_data(
        self,
        user_id: UUID
    ) -> User:
        #TODO
        return User(
            contacts=None,
            postal=None,
            personal_profiles=None,
            professional_profiles=None
        )
