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
        user_subscription = self.subscription_service.get_user_subscription(user_id=user.get('user_id'))
        if not user_subscription:
            return self.notification_persistence.get_notification_text_by_title(
                NotificationTitles.CHOOSE_PLAN.value).text

        current_plan = self.plan_persistence.get_current_plan(user_id=user.get('user_id'))
        plan_leads_credits = current_plan.leads_credits
        plan_lead_credit_price = current_plan.lead_credit_price
        leads_credits = user.get('leads_credits')

        result = ((plan_leads_credits - leads_credits) / plan_leads_credits) * 100

        if 80 <= result <= 90:
            notification_template = self.notification_persistence.get_notification_text_by_title(
                NotificationTitles.CONTACT_LIMIT_APPROACHING.value).text
            notification_text = notification_template.format(int(result), plan_lead_credit_price)
            return notification_text

        if leads_credits == 0:
            notification_template = self.notification_persistence.get_notification_text_by_title(
                NotificationTitles.PLAN_LIMIT_EXCEEDED.value).text
            inactive_leads_user = self.leads_persistence.get_inactive_leads_user(user_id=user.get('user_id'))
            notification_text = notification_template.format(len(inactive_leads_user))
            return notification_text

        return None

