import logging
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from models.opt_out import OptOutBlackList
from db_dependencies import Db
from resolver import injectable


logger = logging.getLogger(__name__)


@injectable
class OptOutPersistence:
    def __init__(self, db: Db):
        self.db = db

    def save_opt_out(self, email: str, ip_address: str) -> None:
        record = OptOutBlackList(
            email=email, ip=ip_address, created_at=datetime.utcnow()
        )

        self.db.add(record)
        try:
            self.db.commit()
        except IntegrityError as e:
            self.db.rollback()
            if "duplicate key value violates unique constraint" in str(e.orig):
                logger.warning(
                    f"Duplicate opt-out attempt — Email: {email}, IP: {ip_address}"
                )
                return
            logger.error("Unexpected DB error", exc_info=True)
            raise
