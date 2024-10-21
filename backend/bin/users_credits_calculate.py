import asyncio
import logging
import os
import sys

from sqlalchemy import create_engine

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models.users_payments_transactions import UsersPaymentsTransactions
from sqlalchemy.orm import sessionmaker
from models.users import Users
from dotenv import load_dotenv
from sqlalchemy import extract
from datetime import datetime

load_dotenv()
logging.basicConfig(level=logging.INFO)
INTERVAL_HOURS = 3


async def process_users(session, batch_size=100):
    offset = 0
    while True:
        users = session.query(Users).offset(offset).limit(batch_size).all()
        if not users:
            offset = 0
            await asyncio.sleep(INTERVAL_HOURS * 3600)
        for user in users:
            current_year = datetime.now().year
            current_month = datetime.now().month
            user_payments_transactions = (
                session.query(UsersPaymentsTransactions)
                .filter(
                    extract('year', UsersPaymentsTransactions.created_at) == current_year,
                    extract('month', UsersPaymentsTransactions.created_at) == current_month,
                    UsersPaymentsTransactions.user_id == user.id
                )
                .all()
            )
            leads_credits = 0

        session.commit()
        offset += batch_size


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
