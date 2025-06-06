from models import UserDomains, IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration, Integration
from models.integrations.external_apps_installations import ExternalAppsInstall
from models.kajabi import Kajabi
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import and_, or_


class IntegrationsPresistence:

    def __init__(self, db: Session) -> None:
        self.db = db

    def create_integration(self, data: dict) -> UserIntegration:
        integration = UserIntegration(**data)
        self.db.add(integration)
        self.db.commit()
        return integration

    def create_kajabi(self, text):
        kajabi_model = Kajabi(
            text=text
        )
        self.db.add(kajabi_model)
        self.db.commit()
        return kajabi_model

    def get_integration_by_shop_id(self, shop_id: str) -> UserIntegration:
        user_integration = (
            self.db.query(UserIntegration)
                .filter(
                UserIntegration.shop_id == str(shop_id)
            )
                .first()
        )
        return user_integration

    def get_integration_by_shop_url(self, shop_url):
        user_integration = (
            self.db.query(UserIntegration)
                .filter(
                UserIntegration.shop_domain.like(f"%{shop_url}")
            )
                .first()
        )
        return user_integration

    def has_integration_and_data_sync(self, user_id: int) -> bool:
        row = (
            self.db.query(UserIntegration)
            .filter(
                UserIntegration.user_id == user_id,
            )
            .first()
        )
        return row is not None

    def has_any_sync(self, user_id: int) -> bool:
        row = (
            self.db.query(UserIntegration)
            .join(
                IntegrationUserSync,
                IntegrationUserSync.integration_id == UserIntegration.id
            )
            .filter(
                UserIntegration.user_id == user_id,
            )
            .first()
        )
        return row is not None


    def get_external_apps_installations_by_shop_hash(self, shop_hash):
        external_apps_install = self.db.query(ExternalAppsInstall).filter(
            ExternalAppsInstall.store_hash == shop_hash).first()
        return external_apps_install

    def delete_external_apps_installations(self, shop_hash):
        self.db.query(ExternalAppsInstall).filter(ExternalAppsInstall.store_hash == shop_hash).delete()
        self.db.commit()

    def get_integration_by_user(self, domain_id: Optional[int], filters: list, user_id: Optional[int]):
        query = self.db.query(UserIntegration)

        or_conditions = []
        if domain_id is not None:
            or_conditions.append(UserIntegration.domain_id == domain_id)
        if user_id is not None:
            or_conditions.append(UserIntegration.user_id == user_id)

        if or_conditions:
            query = query.filter(or_(*or_conditions))

        if filters:
            query = query.filter(UserIntegration.service_name.notin_(filters))

        return query.all()

    def update_credential_for_service(self, domain_id: int, service_name: str, access_token):
        user_integration = self.db.query(UserIntegration) \
            .filter(UserIntegration.domain_id == domain_id, UserIntegration.service_name == service_name).first()
        user_integration.access_token = access_token
        self.db.commit()

        return user_integration

    def get_credential(self, **filter_by):
        return self.db.query(UserIntegration).filter_by(**filter_by).first()

    def update_app_home_opened(self, slack_team_id):
        self.db.query(UserIntegration) \
            .filter(UserIntegration.slack_team_id == slack_team_id) \
            .update({UserIntegration.is_slack_first_message_sent: True}, synchronize_session='fetch')
        self.db.commit()

    def get_credentials_for_service(self, domain_id: int, user_id, service_name: str, **filter_by):
        query = self.db.query(UserIntegration).filter(UserIntegration.service_name == service_name)
        if user_id:
            query = query.filter(or_(UserIntegration.domain_id == domain_id, UserIntegration.user_id == user_id))
        else:
            query = query.filter(UserIntegration.domain_id == domain_id)

        return query.filter_by(**filter_by).first()

    def get_smart_credentials_for_service(self, user_id, service_name: str):
        return self.db.query(UserIntegration) \
            .filter(UserIntegration.service_name == service_name, UserIntegration.user_id == user_id).first()

    def delete_integration_by_slack_team_id(self, team_id: str):
        self.db.query(UserIntegration) \
            .filter(UserIntegration.slack_team_id == team_id).delete()
        self.db.commit()

    def delete_integration(self, domain_id: Optional[int], service_name: str, user_id: Optional[str]):
        query = self.db.query(UserIntegration).filter(UserIntegration.service_name == service_name)

        or_conditions = []
        if domain_id is not None:
            or_conditions.append(UserIntegration.domain_id == domain_id)
        if user_id is not None:
            or_conditions.append(UserIntegration.user_id == user_id)

        if or_conditions:
            query = query.filter(or_(*or_conditions))

        query.delete()
        self.db.commit()

    def edit_integrations(self, id: int, data: dict) -> UserIntegration:
        result = self.db.query(UserIntegration) \
            .filter(UserIntegration.id == id).update(data, synchronize_session='fetch')
        self.db.commit()

    def get_integrations_service(self, **filter_by):
        query = self.db.query(Integration)
        for key, value in filter_by.items():
            if key == 'service_name':
                query = query.filter(Integration.service_name.in_(value))
            else:
                query = query.filter_by(**{key: value})
        return query.order_by(Integration.service_name.asc()).filter(Integration.data_sync == True).all()

    def get_all_integrations_filter_by(self, **filter_by):
        return self.db.query(UserIntegration).filter_by(**filter_by).all()

    def get_users_integrations(self, service_name):
        return self.db.query(UserIntegration).filter_by(service_name=service_name).first()
