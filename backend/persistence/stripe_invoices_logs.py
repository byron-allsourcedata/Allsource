import logging

from sqlalchemy import insert

from db_dependencies import Db
from models import StripeInvoiceLogs
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class StripeInvoicesLogsPersistence:
    def __init__(self, db: Db):
        self.db = db

    def save_model(
        self, event_type: str, customer_data: dict
    ) -> StripeInvoiceLogs:
        stmt = (
            insert(StripeInvoiceLogs)
            .values(
                type=event_type,
                invoices_data=customer_data,
            )
            .returning(StripeInvoiceLogs)
        )
        result = self.db.execute(stmt)
        saved = result.scalar_one()
        self.db.commit()
        return saved
