import asyncio
import logging
import os
import sys

from sqlalchemy import create_engine, and_, func

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from sqlalchemy.orm import sessionmaker
from models.users_unlocked_5x5_users import UsersUnlockedFiveXFiveUser
from models.five_x_five_users import FiveXFiveUser
from models.leads_users import LeadUser
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)


def update_users_unlocked(session, five_x_five_user_id: int, user_id: int, created_at, domain_id: int):
    five_x_five_user = session.query(FiveXFiveUser)\
        .filter(FiveXFiveUser.id == five_x_five_user_id).first()
        
    users_unlocked_five_x_five_user = session.query(UsersUnlockedFiveXFiveUser)\
        .filter(UsersUnlockedFiveXFiveUser.five_x_five_up_id == five_x_five_user.up_id, UsersUnlockedFiveXFiveUser.domain_id == domain_id).first()
    if not users_unlocked_five_x_five_user:
        users_unlocked_five_x_five_user = UsersUnlockedFiveXFiveUser(
                        user_id=user_id,
                        created_at=created_at,
                        updated_at=created_at,
                        amount_credits=1,
                        domain_id=domain_id,
                        five_x_five_up_id=five_x_five_user.up_id
                    )
        session.add(users_unlocked_five_x_five_user)
        session.commit()

async def process_users(session):
    min_id = session.query(func.min(LeadUser.id)).scalar()
    max_id = session.query(func.max(LeadUser.id)).scalar()
    current_id = min_id - 1

    while current_id < max_id:
        logging.info(f"current_id: {current_id}")
        logging.info(f"max_id: {max_id}")
        leads_users = session.query(LeadUser.five_x_five_user_id, LeadUser.user_id, LeadUser.created_at, LeadUser.domain_id).filter(
            and_(
                LeadUser.id > current_id,
                LeadUser.id <= current_id + 1000
            )
        ).all()
        for lead_user in leads_users:
                update_users_unlocked(
                    session=session,
                    five_x_five_user_id=lead_user.five_x_five_user_id,
                    user_id=lead_user.user_id,
                    created_at=lead_user.created_at,
                    domain_id=lead_user.domain_id
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
