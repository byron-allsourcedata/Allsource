from models.leads_orders import LeadOrders
from sqlalchemy.orm import Session


class SuppressionPersistence:

    def __init__(self, db: Session):
        self.db = db