#!/usr/bin/env python3
import asyncio
import logging
import os
import sys

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from persistence.sendgrid_persistence import SendgridPersistence
from services.pixel_installation import PixelInstallationService
from models.users import Users
from models.users_domains import UserDomains
from dotenv import load_dotenv


load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INTERVAL_HOURS = 3


async def check_and_update_pixel_installations(db_session):
    try:
        sendgrid_persistence_service = SendgridPersistence(db_session)
        pixel_service = PixelInstallationService(db_session, sendgrid_persistence_service)

        domains = db_session.query(UserDomains).filter(UserDomains.is_pixel_installed == False).all()

        for domain in domains:
            company_website = domain.domain
            if company_website:
                result = pixel_service.check_pixel_installed_via_parse(company_website, domain.__dict__)
                if result['success']:
                    logger.info(f"Pixel confirmed for user {domain.id}. Subscription updated.")
                else:
                    logger.info(f"Pixel not confirmed for user {domain.id}.")
            else:
                logger.info(f"User {domain.id} has no company website.")

    except Exception as e:
        logger.error(f"An error occurred: {e}")


async def main():
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    Session = sessionmaker(bind=engine)

    while True:
        db_session = Session()
        try:
            await check_and_update_pixel_installations(db_session)
        finally:
            db_session.close()

        await asyncio.sleep(INTERVAL_HOURS * 3600)


if __name__ == "__main__":
    asyncio.run(main())
