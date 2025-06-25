from db_dependencies import Db
from models.integrations.external_apps_installations import ExternalAppsInstall

from resolver import injectable


@injectable
class ExternalAppsInstallationsPersistence:
    def __init__(self, db: Db):
        self.db = db

    def create_epi(self, data: dict):
        new_epi = ExternalAppsInstall(**data)
        self.db.add(new_epi)
        self.db.commit()
        return new_epi

    def delete_epi(self, id: dict):
        self.db.query(ExternalAppsInstall).filter(
            ExternalAppsInstall.id == id
        ).delete()
        self.db.commit()

    def get_epi_by_filter_one(self, **filter_by):
        return self.db.query(ExternalAppsInstall).filter_by(**filter_by).first()

    def get_epi_by_filter_all(self, **filter_by):
        return self.db.query(ExternalAppsInstall).filter_by(**filter_by).all()
