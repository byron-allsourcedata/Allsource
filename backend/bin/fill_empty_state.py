import asyncio
import logging
import os
import sys
import requests

from sqlalchemy import create_engine,func

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from sqlalchemy.orm import sessionmaker
from models.state import States
from models.five_x_five_locations import FiveXFiveLocations
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
INTERVAL_HOURS = 3

def get_state_name_from_city_and_code(city_name, state_code):
    username = 'prosteg'
    endpoint = f"http://api.geonames.org/searchJSON?name={city_name}&adminCode1={state_code}&country=US&username={username}&maxRows=10"
    
    response = requests.get(endpoint)
    data = response.json()
    
    if 'geonames' in data and len(data['geonames']) > 0:
        for result in data['geonames']:
            if result.get('adminCode1') == state_code.upper() and result.get('toponymName').lower() == city_name.lower():
                return result.get('adminName1')
    
    return None



def save_state_to_user(session, state_code, city_name):
    state_name = get_state_name_from_city_and_code(city_name, state_code.upper())
    logging.info(f"state code {state_code}")
    logging.info(f"state name {state_name}")
    if state_name:
        session.query(States).filter(States.state_code == state_code).update({
                        States.state_name: state_name
                    })
        session.flush()


async def process_state(session, batch_size=100):
    offset = 0
    while True:
        subquery = (
            session.query(
                States.state_code,
                func.min(States.id).label('id')
            )
            .filter(States.state_name.is_(None))
            .group_by(States.state_code)
            .subquery()
        )
        
        states = (
            session.query(States)
            .join(subquery, States.id == subquery.c.id)
            .offset(offset)
            .limit(batch_size)
            .all()
        )
        if not states:
            offset = 0
            await asyncio.sleep(INTERVAL_HOURS * 3600)
        for state in states:
            city_name = (
            session.query(FiveXFiveLocations.city).where(FiveXFiveLocations.state_id == state.id).first()
            )
            save_state_to_user(session, state.state_code, city_name[0])
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

        await process_state(db_session)

    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())
