from sqlalchemy.orm import Session
from models.integrations.suppresions import LeadsSupperssion

class SuppressionPersistence:

    def __init__(self, db: Session) -> None:
        self.db = db


    def create(self, data: dict) -> LeadsSupperssion:
        lead_suppression = LeadsSupperssion(**data)
        self.db.add(lead_suppression)
        self.db.commit()
        return lead_suppression
    
    def get_leads_suppression_filter_by(self, **filter_by):
        return self.db.query(LeadsSupperssion).filter_by(**filter_by).all()
    
    def get_last_leads_suppression(self, domain_id: int, integration_id: int) -> LeadsSupperssion:
        try:
            leads_suppression =  self.db.query(LeadsSupperssion).filter(LeadsSupperssion.domain_id == domain_id, LeadsSupperssion.integrations_id == integration_id).order_by(LeadsSupperssion.id.asc).all()
            return leads_suppression[-1]
        except Exception:
            ...