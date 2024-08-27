from schemas.integrations.integrations import Lead
from abc import ABC, abstractmethod


class IntegrationsABC(ABC):
        
    @abstractmethod
    def mapped_leads(self):
        ...


    @abstractmethod
    def get_all_leads(self):
        ...

    @abstractmethod
    def save_integrations(self):
        ...

    @abstractmethod
    def save_leads(self):
        ...

    @abstractmethod
    def create_integration(self):
        ...
    
    # @abstractmethod
    # def __get_lists_upd_crt_leads_by_audience(self):
    #     ...

    # @abstractmethod
    # def export_leads(self):
    #     ...