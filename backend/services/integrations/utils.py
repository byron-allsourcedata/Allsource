from schemas.integrations.integrations import Lead
from abc import ABC, abstractmethod


class IntegrationsABC(ABC):
        
    @abstractmethod
    def __mapped_leads(self):
        ...


    @abstractmethod
    def get_leads(self):
        ...


    @abstractmethod
    def __save_integrations(self):
        ...

    def __save_leads(self):
        ...


    @abstractmethod
    def create_integration(self):
        ...
    