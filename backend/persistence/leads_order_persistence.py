from models.leads_orders import LeadOrders
from sqlalchemy.orm import Session
class LeadOrdersPersistence:

    def __init__(self, db: Session):
        self.db = db

    def create_lead_order(self, data: dict):
        if self.db.query(LeadOrders).filter_by(order_id=data.get('order_id'), id=data['shopify_order_id']).first():
            return
        lead_order = LeadOrders(**data)
        lead_order = self.db.add(lead_order)
        return lead_order