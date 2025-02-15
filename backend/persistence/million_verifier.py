from sqlalchemy.orm import Session
from datetime import datetime, timezone
from models.leads_emails_verification import LeadEmailsVerification

class MillionVerifierPersistence:
    def __init__(self, db: Session):
        self.db = db
    
    def find_checked_email(self, email):
        return self.db.query(LeadEmailsVerification).filter(LeadEmailsVerification.email == email).first()
    
    def save_checked_email(self, email, is_verify, verify_result):
        account_notification = LeadEmailsVerification(
            email=email,
            is_verify=is_verify,
            created_at=datetime.now(timezone.utc),
            verify_result=verify_result

        )
        self.db.add(account_notification)
        self.db.commit()