import math
import logging
import os
import sys

import pandas as pd
from sqlalchemy import create_engine, or_

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models.five_x_five_users import FiveXFiveUser
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

INDUSTRIES = [
    'Car Dealership', 'Solar Panel', 'Marketing agencies', 'CPA accountants', 'Law firms'
]

JOB_TITLES = ['CEO', 'Director', 'Marketing Manager', 'Marketing Head']

OUTPUT_FILE = 'filtered_users_16.05.2025.csv'

def industry_filter(industry_column):
    """Create OR filters for industry column."""
    return or_(*[industry_column.ilike(f"%{industry}%") for industry in INDUSTRIES])

def title_matches(title):
    if not title:
        return False
    title_lower = title.lower()
    return any(job.lower() in title_lower for job in JOB_TITLES)

def save_to_csv(data, part):
    filename = f"filtered_users_part{part}.csv"
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    logging.info(f"Saved {len(data)} records to {filename}")

def parse_range(count_str: str):
    if not count_str:
        return None, None
    count_str = count_str.strip()
    if count_str.endswith('+'):
        lower = int(count_str[:-1])
        upper = math.inf
    else:
        parts = count_str.split(' to ')
        lower, upper = map(int, parts)
    return lower, upper

def size_matches(count_str: str, min_size=10, max_size=250) -> bool:
    lower, upper = parse_range(count_str)
    if lower is None:
        return False
    return not (upper < min_size or lower > max_size)

def save_users_interests(db_session):
    try:
        logging.info("Querying filtered users...")

        # query = db_session.query(FiveXFiveUser).filter(
        #     industry_filter(FiveXFiveUser.primary_industry)
        # ).yield_per(1000)
        
        query = db_session.query(FiveXFiveUser).yield_per(1000)

        user_data = []
        part = 1
        count = 0

        for user in query:
            if not title_matches(user.job_title):
                continue
            
            if not size_matches(user.company_employee_count):
                continue

            user_data.append({
                "First Name": user.first_name,
                "Last Name": user.last_name,
                "Job Title": user.job_title,
                "Company Name": user.company_name,
                "Primary Industry": user.primary_industry,
                "Additional Personal Emails": user.additional_personal_emails,
                "Personal Email": user.personal_emails,
                "Business Email": user.business_email,
                "LinkedIn": user.linkedin_url,
                "Company Domain": user.company_domain,
                "Company Phone": user.company_phone,
                "Company City": user.company_city,
                "Company State": user.company_state,
                "Company Employee Count": user.company_employee_count
            })

            count += 1
            if count % 10000 == 0:
                save_to_csv(user_data, part)
                part += 1
                user_data = []

        if user_data:
            save_to_csv(user_data, part)

        logging.info("Finished exporting all user data.")

    except Exception as e:
        logging.error("Error while filtering/saving users", exc_info=True)


def main():
    logging.info("Started")
    db_session = None
    try:
        engine = create_engine(
            f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()
        save_users_interests(db_session=db_session)
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    main()
