import logging
import re

from sqlalchemy import any_, func, delete, or_, select
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from persistence.enrichment_users import EnrichmentUsersPersistence
from models.five_x_five_phones import FiveXFivePhones
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_users import FiveXFiveUser
from models.opt_out import OptOutBlackList
from db_dependencies import Db
from resolver import injectable

logger = logging.getLogger(__name__)
logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


@injectable
class OptOutPersistence:
    def __init__(
        self, db: Db, enrichment_user_persistence: EnrichmentUsersPersistence
    ):
        self.db = db
        self.enrichment_user_persistence = enrichment_user_persistence

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

    def _get_blacklisted_user_ids(self, email: str) -> list[int]:
        """Function returns list[int] in case if more than one match found in 5x5_users"""

        stmt = select(FiveXFiveUser.id).where(
            or_(
                FiveXFiveUser.business_email == email,
                FiveXFiveUser.personal_emails == email,
                any_(
                    func.string_to_array(
                        FiveXFiveUser.additional_personal_emails, ", "
                    )
                )
                == email,
            )
        )

        return [row.id for row in self.db.execute(stmt).all()]

    def _delete_blacklister_user(self, user_ids: list[int]) -> None:
        if user_ids:
            stmt = delete(FiveXFiveUser).where(FiveXFiveUser.id.in_(user_ids))
            self.db.execute(stmt)

    def _delete_email(self, email: str) -> None:
        stmt = delete(FiveXFiveEmails).where(FiveXFiveEmails.email == email)
        self.db.execute(stmt)

    def _get_user_phone_numbers(self, user_id: int) -> list[str]:
        stmt = select(
            FiveXFiveUser.mobile_phone,
            FiveXFiveUser.direct_number,
            FiveXFiveUser.personal_phone,
        ).where(FiveXFiveUser.id == user_id)

        response = self.db.execute(stmt).all()

        phones = []
        for row in response:
            for value in [
                row.mobile_phone,
                row.direct_number,
                row.personal_phone,
            ]:
                if value:
                    phones.extend(value.split(", "))

        cleaned = list({re.sub(r"\D", "", phone) for phone in phones})
        return cleaned

    def _get_user_phones_ids(self, cleaned_phones: list[str]) -> list[int]:
        if not cleaned_phones:
            return []
        stmt = select(FiveXFivePhones.id).where(
            FiveXFivePhones.number.in_(cleaned_phones)
        )
        return [row.id for row in self.db.execute(stmt).all()]

    def _delete_user_phones(self, phones_ids: list[int]) -> None:
        if phones_ids:
            stmt = delete(FiveXFivePhones).where(
                FiveXFivePhones.id.in_(phones_ids)
            )
            self.db.execute(stmt)

    def delete_lead(self, email: str) -> None:
        """Delete lead by email"""

        try:
            user_ids = self._get_blacklisted_user_ids(email)
            self._delete_blacklister_user(user_ids)  # Delete from 5x5_users
            self._delete_email(email)  # Delete email from 5x5_emails

            for user_id in user_ids:
                phones = self._get_user_phone_numbers(user_id)
                phones_ids = self._get_user_phones_ids(phones)
                self._delete_user_phones(phones_ids)

            self.db.commit()

        except Exception as e:
            self.db.rollback()
            logger.error(
                f"Failed to delete lead {email}: {str(e)}", exc_info=True
            )
            raise

    def delete_lead_from_clickhouse(self, email: str) -> None:
        """Delete lead from enrichment_users (ClickHouse) by email"""
        try:
            self.enrichment_user_persistence.delete_asids_by_emails([email])
        except Exception as e:
            logger.error(
                f"Failed to delete ClickHouse lead for email {email}: {str(e)}",
                exc_info=True,
            )
            raise
