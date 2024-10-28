from models.account_notification import AccountNotification
from models.sendgrid_template import SendgridTemplate
from sqlalchemy.orm import Session


class NotificationPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_notification_text_by_title(self, title: str) -> str:
        return self.db.query(AccountNotification).filter(AccountNotification.title == title).first()


