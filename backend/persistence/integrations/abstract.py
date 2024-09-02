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

    def save_customer(self, customer: dict, user_id: int) -> str:
        existing_lead_user = (
            self.session.query(LeadUser)
            .join(Lead, Lead.id == LeadUser.lead_id)
            .filter(Lead.business_email == customer['email'], LeadUser.user_id == user_id)
            .first()
        )

        if existing_lead_user:
            integration_lead_id = getattr(existing_lead_user, self.integration_leads_column)
            if integration_lead_id:
                self.session.query(self.model).filter(self.model.id == integration_lead_id).update(customer)
                self.session.commit()
                return "MATCHED"
            else:
                integration_leads = self.model(**customer)
                self.session.add(integration_leads)
                self.session.commit()

                self.session.query(LeadUser).filter(LeadUser.id == existing_lead_user.id).update({
                    self.integration_leads_column: integration_leads.id,
                    LeadUser.funnel: 'Converted',
                    LeadUser.status: 'Existing'
                })
                self.session.commit()
                return "MATCHED"
        else:
            existing_record = self.session.query(self.model).filter(self.model.email == customer['email']).first()
            if existing_record:
                for key, value in customer.items():
                    setattr(existing_record, key, value)
                self.session.commit()
                return "UPDATED"
            else:
                new_record = self.model(**customer)
                self.session.add(new_record)
                self.session.commit()
                return "CREATED"
            
        
    def get_service_user_by_id(self, id: int):
        return self.session.query(self.model).filter(self.model.id == id).first()
