import time
import logging
import os

from config.sentry import SentryConfig
from dependencies import (
    LeadsPersistence,
    AudiencePersistence,
    IntegrationService,
)

from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.engine import create_engine
from persistence.integrations.integrations_persistence import IntegrationsPersistence
import dotenv


if __name__ == "__main__":
    SentryConfig.initialize()
    logging.basicConfig(level=logging.INFO)
    dotenv.load_dotenv()
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    Session = sessionmaker(bind=engine)
    session = Session()
    audience_persistence = AudiencePersistence(db=session)
    leads_persistence = LeadsPersistence(db=session)
    integrations_persistence = IntegrationsPersistence(db=session)
    integration_serivce = IntegrationService(
        session,
        integrations_persistence,
        leads_persistence,
        audience_persistence,
    )
    while True:
        with integration_serivce as integ_service:
            serv = integrations_persistence.get_integrations_service()
            for platform in serv:
                try:
                    users_sync = integ_service.get_sync_users()
                    for user in users_sync:
                        service = getattr(integ_service, platform.service_name)
                        service.sync(user.domain_id)
                except Exception as e:
                    logging.info(e)
                    SentryConfig.capture(e)
            time.sleep(60 * 60)
