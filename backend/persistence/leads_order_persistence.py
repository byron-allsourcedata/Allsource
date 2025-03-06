from models.leads_orders import LeadOrders
from sqlalchemy.orm import Session
from datetime import datetime, timezone
class LeadOrdersPersistence:

    def __init__(self, db: Session):
        self.db = db

    def create_lead_order(self, data: dict):
        lead_order = self.db.query(LeadOrders).filter(LeadOrders.platform_order_id == data.get('order_id'), 
                                            LeadOrders.lead_user_id == data.get('leads_id')).first()
        if lead_order:
            lead_order.platform_created_at = data.get('platform_created_at')
            lead_order.total_price = data.get('total_price')
            lead_order.currency_code = data.get('currency_code')
            lead_order.platfrom_email = data.get('platfrom_email')
            lead_order.platform_user_id = data.get('platform_user_id')
            lead_order.created_at = datetime.now(timezone.utc)
            self.db.add(lead_order)
            self.db.commit()
            return lead_order
        
        lead_order = LeadOrders(**data)
        self.db.add(lead_order)
        self.db.commit()
        return lead_order