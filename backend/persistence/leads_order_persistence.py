from models.leads_orders import LeadOrders
from sqlalchemy.orm import Session
class LeadOrdersPersistence:

    def __init__(self, db: Session):
        self.db = db

    def create_lead_order(self, data: dict):
        print('asd')
        if self.db.query(LeadOrders).filter(LeadOrders.platform_order_id == data.get('order_id'), 
                                            LeadOrders.lead_user_id == data.get('leads_id'), 
                                            LeadOrders.platform_user_id == data.get('platform_user_id')).first():
            return
        lead_order = LeadOrders(**data)
        self.db.add(lead_order)
        self.db.commit()
        return lead_order