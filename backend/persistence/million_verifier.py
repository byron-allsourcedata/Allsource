from sqlalchemy.orm import Session
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import insert

from db_dependencies import Db
from models.leads_emails_verification import LeadEmailsVerification
from models.million_verify_files import MillionVerifyFiles
from resolver import injectable


@injectable
class MillionVerifierPersistence:
    def __init__(self, db: Db):
        self.db = db

    def find_checked_email(self, email):
        return (
            self.db.query(LeadEmailsVerification)
            .filter(LeadEmailsVerification.email == email)
            .first()
        )

    def save_checked_email(self, email, is_verify, verify_result):
        lead_request = (
            insert(LeadEmailsVerification)
            .values(
                email=email,
                is_verify=is_verify,
                created_at=datetime.now(timezone.utc),
                verify_result=verify_result,
            )
            .on_conflict_do_nothing(index_elements=["email"])
        )
        self.db.execute(lead_request)
        self.db.commit()

    # ---------- Bulk API ----------
    def save_file_record(
        self, file_id: int, md5_hash: str, origin_aud_id, is_ready: bool = False
    ):
        stmt = (
            insert(MillionVerifyFiles)
            .values(
                file_id=file_id,
                md5_hash=md5_hash,
                origin_aud_id=origin_aud_id,
                is_ready=is_ready,
                created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                updated_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            .on_conflict_do_nothing(index_elements=["file_id", "md5_hash"])
        )
        self.db.execute(stmt)
        self.db.commit()

    def mark_file_ready(self, file_id: int):
        self.db.query(MillionVerifyFiles).filter(
            MillionVerifyFiles.file_id == file_id
        ).update(
            {
                "is_ready": True,
                "updated_at": datetime.now(timezone.utc).replace(tzinfo=None),
            }
        )
        self.db.commit()

    def update_file_timestamp(self, file_id: int):
        self.db.query(MillionVerifyFiles).filter(
            MillionVerifyFiles.file_id == file_id
        ).update(
            {"updated_at": datetime.now(timezone.utc).replace(tzinfo=None)}
        )
        self.db.commit()
