import asyncio
import logging
import os
import sys

from sqlalchemy import create_engine, and_, func

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from sqlalchemy.orm import sessionmaker
from utils import create_company_alias
from models.five_x_five_users import FiveXFiveUser
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)


def update_company_alias_to_user(session, user_id: int, company_name:str):
    company_alias = create_company_alias(company_name)
    session.query(FiveXFiveUser).filter(
        FiveXFiveUser.id == user_id
    ).update({FiveXFiveUser.company_alias: company_alias})
    session.commit()

async def process_users(session):
    min_id = session.query(func.min(FiveXFiveUser.id)).scalar()
    max_id = session.query(func.max(FiveXFiveUser.id)).scalar()
    current_id = min_id - 1

    while current_id < max_id:
        logging.info(f"current_id: {current_id}")
        logging.info(f"max_id: {max_id}")
        five_x_five_users = session.query(FiveXFiveUser.id, FiveXFiveUser.company_name, FiveXFiveUser.company_alias).filter(
            and_(
                FiveXFiveUser.id > current_id,
                FiveXFiveUser.id <= current_id + 1000
            )
        ).all()
        for five_x_five_user in five_x_five_users:
            if five_x_five_user.company_name and not five_x_five_user.company_alias:
                update_company_alias_to_user(
                    session=session,
                    user_id=five_x_five_user.id,
                    company_name=five_x_five_user.company_name
                )

        current_id += 1000


async def main():
    logging.info("Started")
    db_session = None
    try:
        engine = create_engine(
            f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()

        await process_users(db_session)

    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())
