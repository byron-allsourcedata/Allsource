import asyncio
import json
import logging
import os
import sys

import pandas as pd
from sqlalchemy import create_engine

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.five_x_five_users import FiveXFiveUser
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)


import logging
import pandas as pd

async def fetch_users_by_domain(db_session, company_domains, output_file, valid_job_titles):
    results = []
    count = 0
    for domain in company_domains:
        count += 1
        logging.info(f"Processed domains {count} / {len(company_domains)}")
        users = db_session.query(FiveXFiveUser).filter(FiveXFiveUser.company_domain == domain).all()
        if users:
            row = {"company domain": domain}
            for user in users:
                print(user.job_title)
                if not user.job_title or user.job_title.lower() not in valid_job_titles:
                    continue
                
                email = None
                mobile_number = None
                
                if user.personal_emails:
                    email = user.personal_emails
                elif user.business_email:
                    email = user.business_email
                elif user.programmatic_business_emails:
                    email = user.programmatic_business_emails
                elif user.additional_personal_emails:
                    email = user.additional_personal_emails
                
                email = email.split(', ')[-1] if email else None
                
                if user.mobile_phone:
                    mobile_number = user.mobile_phone
                elif user.personal_phone:
                    mobile_number = user.personal_phone
                elif user.company_phone:
                    mobile_number = user.company_phone
                mobile_number = mobile_number.split(', ')[-1] if mobile_number else None
                
                if mobile_number or email:
                    row[f"job title_{len(row) // 6}"] = user.job_title
                    row[f"first name_{len(row) // 6}"] = user.first_name
                    row[f"last name_{len(row) // 6}"] = user.last_name
                    row[f"email_{len(row) // 6}"] = email
                    row[f"mobile number_{len(row) // 6}"] = mobile_number
                print(row)
            results.append(row)
            
    df = pd.DataFrame(results)
    df.to_csv(output_file, index=False)
    logging.info(f"Results saved to {output_file}")


async def main():
    logging.info("Started")
    db_session = None

    try:
        engine = create_engine(
            f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()
        input_file = 'tmp/company_domains.txt'
        output_file = 'tmp/output_users.csv'
        job_title = 'tmp/all-jobs.txt'

        with open(input_file, "r") as file:
            content = file.read()
            company_domains = [domain.strip() for domain in content.splitlines() if domain.strip()]
        
        with open(job_title, "r") as file:
            valid_job_titles = {title.strip().lower() for title in file if title.strip()}
            
        await fetch_users_by_domain(db_session, company_domains, output_file, valid_job_titles)

    except Exception as err:
        logging.error("Unhandled Exception:", exc_info=True)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        logging.info("Shutting down...")

if __name__ == "__main__":
    asyncio.run(main())
