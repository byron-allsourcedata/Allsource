from sqlalchemy.orm import Session
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import insert

from db_dependencies import Db
from models.leads_emails_verification import LeadEmailsVerification
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
