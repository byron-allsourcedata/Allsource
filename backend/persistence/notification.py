from sqlalchemy import func
from sqlalchemy.orm import Session

from models.account_notification import AccountNotification
from models.users import Users
from models.users_account_notification import UserAccountNotification


class NotificationPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_account_notification_by_title(self, title: str) -> str:
        return self.db.query(AccountNotification).filter(AccountNotification.title == title).first()

    def save_account_notification(self, user_id, account_notification_id, params=None):
        account_notification = UserAccountNotification(
            user_id=user_id,
            notification_id=account_notification_id,
            params=str(params),

        )
        self.db.add(account_notification)
        self.db.commit()
        return account_notification
    
    def find_account_with_notification(self, user_id, account_notification_id):
        return self.db.query(UserAccountNotification).filter(UserAccountNotification.user_id == user_id, 
                                                      UserAccountNotification.notification_id == account_notification_id, 
                                                      UserAccountNotification.is_checked == False).first()

    def dismiss(self, request, user_id):
        if request is None:
            self.db.query(UserAccountNotification).filter(UserAccountNotification.user_id == user_id).update(
                {UserAccountNotification.is_checked: True},
                synchronize_session=False
            )
        else:
            notification_ids = request.notification_ids
            self.db.query(UserAccountNotification).filter(UserAccountNotification.id.in_(notification_ids)).update(
                {UserAccountNotification.is_checked: True},
                synchronize_session=False
            )

        self.db.commit()

    def delete_notification_by_id(self, notification_id: int, user_id):
        self.db.query(UserAccountNotification).filter(
            UserAccountNotification.user_id == user_id, UserAccountNotification.id == notification_id).delete()
        self.db.commit()

    def get_notifications_by_user_id(self, user_id: str):
        return (self.db.query(
            AccountNotification.text,
            AccountNotification.sub_title,
            AccountNotification.is_dismiss,
            UserAccountNotification.id,
            UserAccountNotification.created_at,
            UserAccountNotification.params,
            UserAccountNotification.is_checked
        )
                .join(UserAccountNotification, AccountNotification.id == UserAccountNotification.notification_id)
                .join(Users, UserAccountNotification.user_id == Users.id)
                .filter(Users.id == user_id)
                .all())
