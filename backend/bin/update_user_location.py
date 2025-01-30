import asyncio
import logging
import os
import sys

from sqlalchemy import create_engine, and_, func

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models.five_x_five_locations import FiveXFiveLocations
from models.five_x_five_users_locations import FiveXFiveUsersLocations
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import sessionmaker
from models.five_x_five_users import FiveXFiveUser
from models.state import States
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)


def convert_to_none(value):
    return value if value not in (None, '', 'None') else None


def save_city_and_state_to_user(session, personal_city, personal_state, five_x_five_user_id, states_dict):
    city = convert_to_none(personal_city)
    state = convert_to_none(personal_state)
    state_id = None
    if city is None and state is None:
        return False
    if city:
        city = city.lower()
    if state:
        state = state.lower()
        state_id = states_dict.get(state)
        if state_id is None:
            state_data = States(
                state_code=state
            )
            session.add(state_data)
            session.flush()
            state_id = state_data.id
    location = session.query(FiveXFiveLocations).filter(
        FiveXFiveLocations.country == 'us',
        FiveXFiveLocations.city == city,
        FiveXFiveLocations.state_id == state_id
    ).first()
    if not location:
        location = FiveXFiveLocations(
            country='us',
            city=city,
            state_id=state_id
        )
        session.add(location)
        session.flush()

    leads_locations = insert(FiveXFiveUsersLocations).values(
        five_x_five_user_id=five_x_five_user_id,
        location_id=location.id
    ).on_conflict_do_nothing()
    session.execute(leads_locations)
    session.flush()


async def process_users(session):
    states = session.query(States).all()
    states_dict = {state.state_code: state.id for state in states}
    min_id = session.query(func.min(FiveXFiveUser.id)).scalar()
    max_id = session.query(func.max(FiveXFiveUser.id)).scalar()
    current_id = min_id - 1

    while current_id < max_id:
        five_x_five_users = session.query(FiveXFiveUser).filter(
            and_(
                FiveXFiveUser.id > current_id,
                FiveXFiveUser.id <= current_id + 1000
            )
        ).all()
        for five_x_five_user in five_x_five_users:
            if five_x_five_user.personal_city and five_x_five_user.personal_state:
                save_city_and_state_to_user(
                    session=session,
                    personal_city=five_x_five_user.personal_city,
                    personal_state=five_x_five_user.personal_state,
                    five_x_five_user_id=five_x_five_user.id,
                    states_dict=states_dict
                )
                session.commit()

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
