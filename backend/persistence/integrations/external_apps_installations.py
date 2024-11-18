from models.integrations.external_apps_installations import ExternalAppsInstall
from sqlalchemy.orm import Session


class ExternalAppsInstallationsPersistence:

    def __init__(self, session: Session):
        self.session = session

    def create_epi(self, data: dict):
        new_epi = ExternalAppsInstall(**data)
        self.session.add(new_epi)
        self.session.commit()
        return new_epi
    
    def delete_epi(self, id: dict):
        self.session.query(ExternalAppsInstall).filter(ExternalAppsInstall.id == id).delete()
        self.session.commit()

    def get_epi_by_filter_one(self, **filter_by):
        return self.session.query(ExternalAppsInstall).filter_by(**filter_by).first()
    
    def get_epi_by_filter_all(self, **filter_by):
        return self.session.query(ExternalAppsInstall).filter_by(**filter_by).all()
