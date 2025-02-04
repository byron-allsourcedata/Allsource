from sqlalchemy.orm import Session
from datetime import datetime, timezone
from models.million_verifier_emails import MillionVerifierEmail

class MillionVerifierPersistence:
    def __init__(self, db: Session):
        self.db = db
    
    def find_checked_email(self, email):
        return self.db.query(MillionVerifierEmail).filter(MillionVerifierEmail.email == email).first()
    
    def save_checked_email(self, email, is_verify):
        account_notification = MillionVerifierEmail(
            email=email,
            is_verify=is_verify,
            created_at=datetime.now(timezone.utc),

        )
        self.db.add(account_notification)
        self.db.commit()