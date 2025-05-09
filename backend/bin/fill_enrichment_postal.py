import asyncio
import functools
import json
import logging
import os
import sys
import regex
import glob
import re
from uuid import UUID
from datetime import datetime
from typing import Optional, Union
import pandas as pd
from sqlalchemy import create_engine, select


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models.five_x_five_locations import FiveXFiveLocations
from models.enrichment.enrichment_postals import EnrichmentPostal
from models.five_x_five_users_locations import FiveXFiveUsersLocations
from models.five_x_five_phones import FiveXFivePhones
from utils import create_company_alias
from models.enrichment.enrichment_users import EnrichmentUser
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

def clean_nan(value):
    if pd.isna(value):
        return None
    return value

def clean_date(value: Union[str, datetime, None]) -> Optional[datetime]:
    if value is None:
        return None

    if isinstance(value, datetime):
        return value

    value = str(value).strip()
    
    if not value:
        return None
    
    value = re.sub(r'(\.\d{6})\d+', r'\1', value)
    formats = [
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y%m%d",
        "%m/%d/%y",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue

    return None

def read_and_fill_enrichment_postal(db_session, file_path):
    try:
        df = pd.read_csv(file_path, dtype=str)

        for record in df.to_dict(orient='records'):
            asid = UUID(record.get('ASID').strip().strip('{}'))
            home_postal_code = clean_nan(record.get('HomePostalCode'))
            existing_asid = db_session.execute(
                select(EnrichmentUser.asid)
                .where(EnrichmentUser.asid == asid)
            ).scalar_one_or_none()
            if not existing_asid:
                continue
            
            home_address_line1 = clean_nan(record.get('HomeAddressLine1'))
            home_address_line2 = clean_nan(record.get('HomeAddressLine2'))
            home_city = clean_nan(record.get('HomeCity'))
            enrichment_postal = insert(EnrichmentPostal).values(
                asid=asid,
                home_address_line1=home_address_line1.lower() if home_address_line1 else None,
                home_address_line2=home_address_line2.lower().capitalize() if home_address_line2 else None,
                home_city=home_city.lower().capitalize() if home_city else None,
                home_state=clean_nan(record.get('HomeState')),
                home_postal_code=home_postal_code if home_postal_code != '-' else None,
                home_country=clean_nan(record.get('HomeCountry')),
                home_address_last_seen=clean_nan(record.get('HomeAddressLastSeen')),
                home_address_validation_status=clean_nan(record.get('HomeAddressValidStatus')),
                business_address_line1=clean_nan(record.get('BusinessAddressLine1')),
                business_address_line2=clean_nan(record.get('BusinessAddressLine2')),
                business_city=clean_nan(record.get('BusinessCity')),
                business_state=clean_nan(record.get('BusinessState')),
                business_postal_code=clean_nan(record.get('BusinessPostalCode')),
                business_country=clean_nan(record.get('BusinessCountry')),
                business_address_last_seen=clean_nan(record.get('BusinessAddressLastSeen')),
                business_address_validation_status=clean_nan(record.get('BusinessAddressValidStatus')),
                address_source=clean_nan(record.get('AddressSource')),
                raw_url_date=clean_date(record.get('RawUrlDate')),
                raw_last_updated=clean_date(record.get('RawLastUpdated')),
                created_date=clean_date(record.get('CreatedDate'))
            ).on_conflict_do_nothing(index_elements=["asid"])
            db_session.execute(enrichment_postal)
            db_session.commit()
                
            logging.info(f"Committed records from {file_path}")

    except Exception as e:
        logging.error(f"Error processing {file_path}: {e}", exc_info=True)
        db_session.rollback()

    logging.info("Finished processing all CSV files.")


def main():
    logging.info("Started")
    db_session = None
    try:
        engine = create_engine(
			f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}",
			pool_pre_ping=True
		)
        Session = sessionmaker(bind=engine)
        db_session = Session()
        path = 'tmp/PostalProfiles_500k.csv'
        read_and_fill_enrichment_postal(db_session, path)
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    main()
