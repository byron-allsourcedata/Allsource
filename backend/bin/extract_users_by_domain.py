import asyncio
import argparse
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

def format_phone_number(phones):
    if phones:
        phone_list = phones.split(',')
        formatted_phones = []
        for phone in phone_list:
            phone_str = phone.strip()
            if phone_str.endswith(".0"):
                phone_str = phone_str[:-2]
            if not phone_str.startswith("+"):
                phone_str = f"+{phone_str}"
            formatted_phones.append(phone_str)

        return ', '.join(formatted_phones)

def check_blacklist_domain_email(business_email, personal_emails, additional_personal_emails, mail_domains):
    blacklist_domains = {domain.lower() for domain in mail_domains}
    
    def has_blacklisted_domain(email):
        if not email:
            return False
        emails = email.split(', ')
        for e in emails:
            domain = e.split('@')[-1].lower()
            domain_base = domain.split('.')[-2]
            if domain_base in blacklist_domains:
                return True
        return False
    
    if business_email and not has_blacklisted_domain(business_email):
        return business_email

    if personal_emails:
        emails = personal_emails.split(', ')
        for email in emails:
            if not has_blacklisted_domain(email):
                return email

    if additional_personal_emails:
        emails = additional_personal_emails.split(', ')
        for email in emails:
            if not has_blacklisted_domain(email):
                return email

    return None

async def fetch_users_by_domain(db_session, company_domains, job_titles, mail_domain):
    results = []
    count = 1
    output_files_counter = 1
    for domain in company_domains:
        if count % 400 == 0:
            output_file = f"tmp/output_users_{output_files_counter}.csv"
            df = pd.DataFrame(results)
            df.to_csv(output_file, index=False)
            logging.info(f"Results saved to {output_file}")
            output_files_counter += 1
            results = []
        logging.info(f"Processed domains {count} / {len(company_domains)}")
        users = db_session.query(FiveXFiveUser).filter(FiveXFiveUser.company_domain == domain).all()
        
        if not users:
            count += 1
            continue

        for user in users:
            if user.job_title and any(word.lower() in job_titles for word in user.job_title.split()):
                email = check_blacklist_domain_email(user.business_email, user.personal_emails, user.additional_personal_emails, mail_domain)
                mobile_number = (
                    user.mobile_phone or 
                    user.personal_phone or 
                    user.company_phone
                )
                mobile_number = mobile_number.split(', ')[-1] if mobile_number else None
                mobile_number = format_phone_number(mobile_number)
                
                if email:
                    results.append({
                        "domain": domain,
                        "job title": user.job_title,
                        "first name": user.first_name,
                        "last name": user.last_name,
                        "email": email,
                        "mobile number": mobile_number,
                        "linkedin URL": user.linkedin_url
                    })
        count += 1
    print(results)
    if results:
        output_file = f"tmp/output_users_{output_files_counter}.csv"
        df = pd.DataFrame(results)
        df.to_csv(output_file, index=False)
        logging.info(f"Results saved to {output_file}")


async def main():
    logging.info("Started")
    db_session = None
    parser = argparse.ArgumentParser(description="Extract users by domain.")
    parser.add_argument("input_file", help="Path to the input file with company domains")
    args = parser.parse_args()

    try:
        engine = create_engine(
            f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()
        if not args.input_file:
            logging.error("input_file is None", exc_info=True)
            return
        input_file = f"tmp/{args.input_file}"
        job_title = 'tmp/all-jobs.txt'
        job_title_path = 'tmp/job-titles.txt'
        mail_path = 'tmp/mail-domain.txt'

        with open(input_file, "r") as file:
            content = file.read()
            company_domains = [domain.strip() for domain in content.splitlines() if domain.strip()]
        
        with open(job_title_path, "r") as file:
            job_titles = {title.strip().lower() for title in file if title.strip()}
        
        with open(job_title_path, "r") as file:
            job_titles = {title.strip().lower() for title in file if title.strip()}
        
        with open(mail_path, "r") as file:
            mail_domain = {title.strip().lower() for title in file if title.strip()}
        
        job_titles = {job_title.lower() for job_title in job_titles}
        await fetch_users_by_domain(db_session, company_domains, job_titles, mail_domain)

    except Exception as err:
        logging.error("Unhandled Exception:", exc_info=True)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        logging.info("Shutting down...")

if __name__ == "__main__":
    asyncio.run(main())
