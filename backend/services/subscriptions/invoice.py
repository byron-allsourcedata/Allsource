import logging

from db_dependencies import Db
from persistence.stripe_invoices_logs import StripeInvoicesLogsPersistence
from persistence.user_persistence import UserPersistence
from resolver import injectable
from services.user_subscriptions import UserSubscriptionsService

logger = logging.getLogger(__name__)


@injectable
class InvoiceService:
    def __init__(
        self,
        db: Db,
        users: UserPersistence,
        user_subscriptions: UserSubscriptionsService,
        stripe_invoices_logs: StripeInvoicesLogsPersistence
    ):
        self.db = db
        self.users = users
        self.user_subscriptions = user_subscriptions
        self.stripe_invoices_logs = stripe_invoices_logs

    def save_invoice_payment(self, event_type: str, invoices_data: dict):
        self.stripe_invoices_logs.save_model(event_type=event_type, customer_data=invoices_data)

