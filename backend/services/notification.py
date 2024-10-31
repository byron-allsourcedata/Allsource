from enums import NotificationTitles
from persistence.leads_persistence import LeadsPersistence
from persistence.notification import NotificationPersistence
from persistence.plans_persistence import PlansPersistence
from services.subscriptions import SubscriptionService


class Notification:
    def __init__(self, notification_persistence: NotificationPersistence, subscription_service: SubscriptionService,
                 plan_persistence: PlansPersistence, leads_persistence: LeadsPersistence):
        self.notification_persistence = notification_persistence
        self.subscription_service = subscription_service
        self.plan_persistence = plan_persistence
        self.leads_persistence = leads_persistence

    def get_notification(self, user: dict):
        notifications = self.notification_persistence.get_notifications_by_user_id(user_id=user.get('id'))

        result = []
        for notification in notifications:
            params = notification.params.split(', ') if notification.params else []

            try:
                converted_params = [float(param) if '.' in param else int(param) for param in params]
            except ValueError:
                converted_params = []

            text = notification.text.format(*converted_params) if converted_params else notification.text

            result.append({
                'id': notification.id,
                'sub_title': notification.sub_title,
                'text': text,
                'is_checked': notification.is_checked,
                'created_at': int(notification.created_at.timestamp())
            })

        return result

    def dismiss(self, request, user):
        self.notification_persistence.dismiss(request=request, user_id=user.get('id'))
        return 'SUCCESS'
