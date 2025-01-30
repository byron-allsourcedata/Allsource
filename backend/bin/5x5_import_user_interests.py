import logging
import os
import sys
import traceback

from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert
import pandas as pd

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.five_x_five_interests import FiveXFiveInterest

load_dotenv()
FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'tmp', 'consumer_taxo.xlsx')


def check_and_print_excel(session):
    try:
        df = pd.read_excel(FILE_PATH, header=0)
    except Exception as e:
        logging.error(f"Error uploading file: {e}")
        return

    required_columns = {'TOPICID', 'TOPIC_CATEGORY', 'TOPIC_SUBCATEGORY', 'TOPIC', 'DESCRIPTION'}
    actual_columns = set(df.columns)

    if required_columns.issubset(actual_columns):
        filtered_df = df[list(required_columns)].dropna(subset=required_columns).reset_index(drop=True)

        for index, row in filtered_df.iterrows():
            five_x_five_interests = insert(FiveXFiveInterest).values(
                topic_id = row['TOPICID'],
                category=row['TOPIC_CATEGORY'],
                sub_category=row['TOPIC_SUBCATEGORY'],
                topic=row['TOPIC'],
                description = row['DESCRIPTION']
            ).on_conflict_do_nothing()
            session.execute(five_x_five_interests)
            session.commit()
    else:
        logging.error("Some necessary columns are missing from the file.")


def main():
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}")
    Session = sessionmaker(bind=engine)
    session = Session()
    logging.info("Started")
    try:
        check_and_print_excel(session)
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        traceback.print_exc()
    finally:
        session.close()
        logging.info("Connection to the database closed")


main()
