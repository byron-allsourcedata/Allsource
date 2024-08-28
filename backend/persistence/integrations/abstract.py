from abc import ABC, abstractmethod
from models.leads_users import LeadUser
from models.leads import Lead
from sqlalchemy.orm import Session

class IntegrationPersistenceABC(ABC):

    @abstractmethod
    def save_customer(self):
        ...

    def get_service_user_by_id(self):
        ...

class ServiceIntegrationsPersistence(IntegrationPersistenceABC):

    model = None
    integration_leads_column = None

    def __init__(self, session: Session):
        self.session = session

    def save_customer(self, customer: dict, user_id: int):
        existing_lead_user = self.session.query(LeadUser).join(Lead, Lead.id == LeadUser.lead_id).filter(Lead.business_email == customer['email'], LeadUser.user_id == user_id).first()
        if existing_lead_user:
            if getattr(existing_lead_user, self.integration_leads_column):
                self.session.query(self.model).where(self.model.id == getattr(existing_lead_user, self.integration_leads_column)).update({
                    **customer
                }) 
                self.session.commit()
                return "UPDATED"
            integrations_leads = self.model(**customer)
            self.session.add(integrations_leads)
            self.session.commit()
            self.session.query(LeadUser).filter(LeadUser.id == existing_lead_user.id).update({
                self.integration_leads_column: integrations_leads.id,
                LeadUser.funnel: 'Converted',
                LeadUser.status: 'Existing'
            })
            self.session.commit()
            return "CREATED"
        
    def get_service_user_by_id(self, id: int):
        return self.session.query(self.model).filter(self.model.id == id).first()
