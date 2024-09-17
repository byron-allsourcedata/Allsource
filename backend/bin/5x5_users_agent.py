import asyncio
import functools
import json
import logging
import os
import sys

import pandas as pd
from sqlalchemy import create_engine

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models.five_x_five_locations import FiveXFiveLocations
from models.five_x_five_users_locations import FiveXFiveUsersLocations
from models.five_x_five_phones import FiveXFivePhones
from models.five_x_five_users_phones import FiveXFiveUsersPhones
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_names import FiveXFiveNames
from models.state import States
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from config.rmq_connection import RabbitMQConnection
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import sessionmaker
from models.five_x_five_users import FiveXFiveUser
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = 'trovo-coop-shakespeare'
QUEUE_USERS_USERS_ROWS = '5x5_users_rows'


def convert_to_none(value):
    if pd.isna(value) or value is None or value == 'nan':
        return None
    return value


def save_emails_to_user(session, emails, five_x_five_user_id, type):
    for email in emails:
        email = email.strip()
        email = convert_to_none(email)
        if email:
            email_obj = session.query(FiveXFiveEmails).filter(
                FiveXFiveEmails.email == email).first()
            email_host = None
            if not email_obj:
                email_host = email.split('@')[-1] if '@' in email else None
                if email_host:
                    email_obj = FiveXFiveEmails(
                        email=email,
                        email_host=email_host
                    )
                    session.add(email_obj)
                    session.flush()
            if email_obj:
                five_x_five_user_email = insert(FiveXFiveUsersEmails).values(
                    user_id=five_x_five_user_id,
                    email_id=email_obj.id,
                    type=type
                ).on_conflict_do_nothing()
                session.execute(five_x_five_user_email)
                session.flush()


def save_phones_to_user(session, phones, five_x_five_user_id, type):
    for number in phones:
        number = number.strip()
        number = convert_to_none(number)
        if number:
            number = number.replace("+", "")
            phone_obj = session.query(FiveXFivePhones).filter(
                FiveXFivePhones.number == number).first()
            if not phone_obj:
                phone_obj = FiveXFivePhones(
                    number=number
                )
                session.add(phone_obj)
                session.flush()

            five_x_five_user_phone = insert(FiveXFiveUsersPhones).values(
                user_id=five_x_five_user_id,
                phone_id=phone_obj.id,
                type=type
            ).on_conflict_do_nothing()
            session.execute(five_x_five_user_phone)
            session.flush()


def save_city_and_state_to_user(session, personal_city, personal_state, five_x_five_user_id):
    city = convert_to_none(personal_city)
    state = convert_to_none(personal_state)
    state_id = None
    if city is None and state is None:
        return False
    if city:
        city = convert_to_none(personal_city).lower()
    if state:
        state = convert_to_none(personal_state).lower()
        state_id = session.query(States.id).filter(States.state_code == state).scalar()
        if state_id is None:
            state_data = States(
            state_code=state,
            )
            session.add(state_data)
            session.flush()
            state_id = state_data.id
    location = session.query(FiveXFiveLocations).filter(
                                               FiveXFiveLocations.city == city,
                                               FiveXFiveLocations.state_id == state).first()
    if not location:
        location = FiveXFiveLocations(
            country='us',
            city=city,
            state_id=state_id,
        )
        session.add(location)
        session.flush()

    leads_locations = insert(FiveXFiveUsersLocations).values(
        five_x_five_user_id=five_x_five_user_id,
        location_id=location.id
    ).on_conflict_do_nothing()
    session.execute(leads_locations)
    session.flush()


async def on_message_received(message, session):
    try:
        message_json = json.loads(message.body)
        user_json = message_json['user']
        last_updated = convert_to_none(
            pd.to_datetime(user_json.get('LAST_UPDATED', None), unit='s', errors='coerce'))
        business_email_last_seen = convert_to_none(
            pd.to_datetime(user_json.get('BUSINESS_EMAIL_LAST_SEEN', None), unit='s', errors='coerce'))
        personal_emails_last_seen = convert_to_none(
            pd.to_datetime(user_json.get('PERSONAL_EMAILS_LAST_SEEN', None), unit='s', errors='coerce'))
        company_last_updated = convert_to_none(
            pd.to_datetime(user_json.get('COMPANY_LAST_UPDATED', None), unit='s', errors='coerce'))
        job_title_last_updated = convert_to_none(
            pd.to_datetime(user_json.get('JOB_TITLE_LAST_UPDATED', None), unit='s', errors='coerce'))
        first_name = str(user_json.get('FIRST_NAME')).lower().strip()
        last_name = str(user_json.get('LAST_NAME', '')).lower().strip()

        first_name_obj = session.query(FiveXFiveNames).filter(
            FiveXFiveNames.name == first_name).first()
        if not first_name_obj:
            first_name_obj = FiveXFiveNames(name=first_name)
            session.add(first_name_obj)
            session.flush()
        first_name_id = first_name_obj.id

        last_name_obj = session.query(FiveXFiveNames).filter(
            FiveXFiveNames.name == last_name).first()
        if not last_name_obj:
            last_name_obj = FiveXFiveNames(name=last_name)
            session.add(last_name_obj)
            session.flush()
        last_name_id = last_name_obj.id

        age_range = str(user_json.get('AGE_RANGE', None))
        age_min = None
        age_max = None
        if age_range and age_range != 'nan':
            if 'and older' in age_range:
                age_min = age_max = int(age_range.split()[0])
            elif '-' in age_range:
                age_min, age_max = age_range.split('-')
                age_min = int(age_min.strip())
                age_max = int(age_max.strip())
            else:
                try:
                    age_min = age_max = int(age_range.strip())
                except ValueError:
                    logging.warning(f"Invalid age range format: {age_range}")

        five_x_five_user = FiveXFiveUser(
            up_id=convert_to_none(user_json.get('UP_ID')),
            cc_id=convert_to_none(user_json.get('CC_ID')),
            first_name=convert_to_none(user_json.get('FIRST_NAME')),
            programmatic_business_emails=convert_to_none(user_json.get('PROGRAMMATIC_BUSINESS_EMAILS')),
            mobile_phone=convert_to_none(user_json.get('MOBILE_PHONE')),
            direct_number=convert_to_none(user_json.get('DIRECT_NUMBER')),
            gender=convert_to_none(user_json.get('GENDER')),
            age_min=age_min,
            age_max=age_max,
            personal_phone=convert_to_none(user_json.get('PERSONAL_PHONE')),
            business_email=convert_to_none(user_json.get('BUSINESS_EMAIL')),
            personal_emails=convert_to_none(user_json.get('PERSONAL_EMAILS')),
            last_name=convert_to_none(user_json.get('LAST_NAME')),
            personal_city=convert_to_none(user_json.get('PERSONAL_CITY')),
            personal_state=convert_to_none(user_json.get('PERSONAL_STATE')),
            company_name=convert_to_none(user_json.get('COMPANY_NAME')),
            company_domain=convert_to_none(user_json.get('COMPANY_DOMAIN')),
            company_phone=convert_to_none(user_json.get('COMPANY_PHONE')),
            company_sic=convert_to_none(user_json.get('COMPANY_SIC')),
            company_address=convert_to_none(user_json.get('COMPANY_ADDRESS')),
            company_city=convert_to_none(user_json.get('COMPANY_CITY')),
            company_state=convert_to_none(user_json.get('COMPANY_STATE')),
            company_zip=None if convert_to_none(user_json.get('COMPANY_ZIP')) is None else str(
                int(user_json.get('COMPANY_ZIP'))),
            company_linkedin_url=convert_to_none(user_json.get('COMPANY_LINKEDIN_URL')),
            company_revenue=convert_to_none(user_json.get('COMPANY_REVENUE')),
            company_employee_count=convert_to_none(user_json.get('COMPANY_EMPLOYEE_COUNT')),
            net_worth=convert_to_none(user_json.get('NET_WORTH')),
            job_title=convert_to_none(user_json.get('JOB_TITLE')),
            last_updated=last_updated,
            personal_emails_last_seen=personal_emails_last_seen,
            company_last_updated=company_last_updated,
            job_title_last_updated=job_title_last_updated,
            first_name_id=first_name_id,
            last_name_id=last_name_id,
            additional_personal_emails=convert_to_none(user_json.get('ADDITIONAL_PERSONAL_EMAILS')),
            linkedin_url=convert_to_none(user_json.get('LINKEDIN_URL')),
            personal_address=convert_to_none(user_json.get('PERSONAL_ADDRESS')),
            personal_address_2=convert_to_none(user_json.get('PERSONAL_ADDRESS_2')),
            personal_zip=None if convert_to_none(user_json.get('PERSONAL_ZIP')) is None else str(
                int(user_json.get('PERSONAL_ZIP'))),
            married=convert_to_none(user_json.get('MARRIED')),
            children=convert_to_none(user_json.get('CHILDREN')),
            income_range=convert_to_none(user_json.get('INCOME_RANGE')),
            homeowner=convert_to_none(user_json.get('HOMEOWNER')),
            seniority_level=convert_to_none(user_json.get('SENIORITY_LEVEL')),
            department=convert_to_none(user_json.get('DEPARTMENT')),
            professional_address=convert_to_none(user_json.get('PROFESSIONAL_ADDRESS')),
            professional_address_2=convert_to_none(user_json.get('PROFESSIONAL_ADDRESS_2')),
            professional_city=convert_to_none(user_json.get('PROFESSIONAL_CITY')),
            professional_state=convert_to_none(user_json.get('PROFESSIONAL_STATE')),
            professional_zip=None if convert_to_none(user_json.get('PROFESSIONAL_ZIP')) is None else str(
                int(user_json.get('PROFESSIONAL_ZIP'))),
            professional_zip4=None if convert_to_none(user_json.get('PROFESSIONAL_ZIP4')) is None else str(
                int(user_json.get('PROFESSIONAL_ZIP4'))),
            primary_industry=convert_to_none(user_json.get('PRIMARY_INDUSTRY')),
            business_email_validation_status=convert_to_none(user_json.get('BUSINESS_EMAIL_VALIDATION_STATUS')),
            business_email_last_seen=business_email_last_seen,
            personal_emails_validation_status=convert_to_none(user_json.get('PERSONAL_EMAILS_VALIDATION_STATUS')),
            work_history=convert_to_none(user_json.get('WORK_HISTORY')),
            education_history=convert_to_none(user_json.get('EDUCATION_HISTORY')),
            company_description=convert_to_none(user_json.get('COMPANY_DESCRIPTION')),
            related_domains=convert_to_none(user_json.get('RELATED_DOMAINS')),
            social_connections=convert_to_none(user_json.get('SOCIAL_CONNECTIONS')),
            dpv_code=convert_to_none(user_json.get('DPV_CODE')),
            personal_zip4=None if convert_to_none(user_json.get('PERSONAL_ZIP4')) is None else str(
                int(user_json.get('PERSONAL_ZIP4'))),
        )
        existing_user = session.query(FiveXFiveUser).filter_by(up_id=five_x_five_user.up_id).first()
        if existing_user:
            existing_user.cc_id = five_x_five_user.cc_id
            existing_user.first_name = five_x_five_user.first_name
            existing_user.programmatic_business_emails = five_x_five_user.programmatic_business_emails
            existing_user.mobile_phone = five_x_five_user.mobile_phone
            existing_user.direct_number = five_x_five_user.direct_number
            existing_user.gender = five_x_five_user.gender
            existing_user.age_min = five_x_five_user.age_min
            existing_user.age_max = five_x_five_user.age_max
            existing_user.personal_phone = five_x_five_user.personal_phone
            existing_user.business_email = five_x_five_user.business_email
            existing_user.personal_emails = five_x_five_user.personal_emails
            existing_user.last_name = five_x_five_user.last_name
            existing_user.personal_city = five_x_five_user.personal_city
            existing_user.personal_state = five_x_five_user.personal_state
            existing_user.company_name = five_x_five_user.company_name
            existing_user.company_domain = five_x_five_user.company_domain
            existing_user.company_phone = five_x_five_user.company_phone
            existing_user.company_sic = five_x_five_user.company_sic
            existing_user.company_address = five_x_five_user.company_address
            existing_user.company_city = five_x_five_user.company_city
            existing_user.company_state = five_x_five_user.company_state
            existing_user.company_zip = five_x_five_user.company_zip
            existing_user.company_linkedin_url = five_x_five_user.company_linkedin_url
            existing_user.company_revenue = five_x_five_user.company_revenue
            existing_user.company_employee_count = five_x_five_user.company_employee_count
            existing_user.net_worth = five_x_five_user.net_worth
            existing_user.job_title = five_x_five_user.job_title
            existing_user.last_updated = five_x_five_user.last_updated
            existing_user.personal_emails_last_seen = five_x_five_user.personal_emails_last_seen
            existing_user.company_last_updated = five_x_five_user.company_last_updated
            existing_user.job_title_last_updated = five_x_five_user.job_title_last_updated
            existing_user.first_name_id = five_x_five_user.first_name_id
            existing_user.last_name_id = five_x_five_user.last_name_id
            existing_user.additional_personal_emails = five_x_five_user.additional_personal_emails
            existing_user.linkedin_url = five_x_five_user.linkedin_url
            existing_user.personal_address = five_x_five_user.personal_address
            existing_user.personal_address_2 = five_x_five_user.personal_address_2
            existing_user.personal_zip = five_x_five_user.personal_zip
            existing_user.married = five_x_five_user.married
            existing_user.children = five_x_five_user.children
            existing_user.income_range = five_x_five_user.income_range
            existing_user.homeowner = five_x_five_user.homeowner
            existing_user.seniority_level = five_x_five_user.seniority_level
            existing_user.department = five_x_five_user.department
            existing_user.professional_address = five_x_five_user.professional_address
            existing_user.professional_address_2 = five_x_five_user.professional_address_2
            existing_user.professional_city = five_x_five_user.professional_city
            existing_user.professional_state = five_x_five_user.professional_state
            existing_user.professional_zip = five_x_five_user.professional_zip
            existing_user.professional_zip4 = five_x_five_user.professional_zip4
            existing_user.primary_industry = five_x_five_user.primary_industry
            existing_user.business_email_validation_status = five_x_five_user.business_email_validation_status
            existing_user.business_email_last_seen = five_x_five_user.business_email_last_seen
            existing_user.personal_emails_validation_status = five_x_five_user.personal_emails_validation_status
            existing_user.work_history = five_x_five_user.work_history
            existing_user.education_history = five_x_five_user.education_history
            existing_user.company_description = five_x_five_user.company_description
            existing_user.related_domains = five_x_five_user.related_domains
            existing_user.social_connections = five_x_five_user.social_connections
            existing_user.dpv_code = five_x_five_user.dpv_code
            existing_user.personal_zip4 = five_x_five_user.personal_zip4
            five_x_five_user_id = existing_user.id
            session.commit()
        else:
            session.add(five_x_five_user)
            session.commit()
            five_x_five_user_id = five_x_five_user.id

        emails = str(user_json.get('BUSINESS_EMAIL', '')).split(', ')
        save_emails_to_user(session, emails, five_x_five_user_id, 'business')
        emails = str(user_json.get('PERSONAL_EMAILS', '')).split(', ')
        save_emails_to_user(session, emails, five_x_five_user_id, 'personal')
        emails = str(user_json.get('ADDITIONAL_PERSONAL_EMAILS', '')).split(', ')
        save_emails_to_user(session, emails, five_x_five_user_id, 'additional_personal')

        mobile_phone = str(user_json.get('MOBILE_PHONE', '')).split(', ')
        mobile_phone_set = set(mobile_phone)
        direct_number = [num for num in str(user_json.get('DIRECT_NUMBER', '')).split(', ') if
                         num not in mobile_phone_set]
        personal_phone = [num for num in str(user_json.get('PERSONAL_PHONE', '')).split(', ') if
                          num not in mobile_phone_set]
        save_phones_to_user(session, mobile_phone, five_x_five_user_id, 'mobile_phone')
        save_phones_to_user(session, direct_number, five_x_five_user_id, 'direct_number')
        save_phones_to_user(session, personal_phone, five_x_five_user_id, 'personal_phone')

        save_city_and_state_to_user(session, user_json.get('PERSONAL_CITY'), user_json.get('PERSONAL_STATE'),
                                    five_x_five_user_id)

        session.commit()

        await message.ack()

    except Exception as e:
        logging.error("excepted message. error", exc_info=True)
        await asyncio.sleep(5)
        await message.reject(requeue=True)


async def main():
    logging.info("Started")
    db_session = None
    rabbitmq_connection = None
    try:
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(
            name=QUEUE_USERS_USERS_ROWS,
            durable=True,
            arguments={
                'x-consumer-timeout': 3600000,
            }
        )

        engine = create_engine(
            f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()
        await queue.consume(
            functools.partial(on_message_received, session=db_session)
        )
        await asyncio.Future()
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        if rabbitmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())
