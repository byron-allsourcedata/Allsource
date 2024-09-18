import time
import logging
import sys
import os
import dotenv


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from dependencies import LeadsPersistence, AudiencePersistence, IntegrationsPresistence, IntegrationService
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.engine import create_engine


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    dotenv.load_dotenv()
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}")
    Session = sessionmaker(bind=engine)
    session = Session()
    audience_persistence = AudiencePersistence(db=session)
    leads_persistence = LeadsPersistence(db=session)
    integrations_persistence = IntegrationsPresistence(db=session)
    integration_serivce = IntegrationService(session, integrations_persistence, leads_persistence, audience_persistence)
    while True:
        with integration_serivce as integ_service:
            serv = integrations_persistence.get_integrations_service()
            for platform in serv:
                try:
                    users_sync = integ_service.get_sync_users()
                    for user in users_sync:
                        service = getattr(integ_service, platform.service_name)
                        service.sync(user.domain_id)
                except Exception as e: logging.info(e) 
            time.sleep(60*60)
