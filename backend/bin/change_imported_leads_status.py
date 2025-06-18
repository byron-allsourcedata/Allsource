import logging
import os
import sys

import dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

dotenv.load_dotenv()

from sqlalchemy.orm import sessionmaker, outerjoin
from sqlalchemy.engine import create_engine
from models import (
    DataSyncImportedLead,
    LeadUser,
    FiveXFiveUser,
    FiveXFiveUsersEmails,
    FiveXFiveEmails,
    LeadEmailsVerification,
)

logging.basicConfig(level=logging.INFO)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    dotenv.load_dotenv()
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        logging.info("Start")
        for data_sync_imported_lead in session.query(
            DataSyncImportedLead
        ).all():
            lead_users_id = data_sync_imported_lead.lead_users_id
            logging.info(f"lead_user_id {lead_users_id}")
            five_x_five_emails = (
                session.query(FiveXFiveEmails.email)
                .join(
                    FiveXFiveUsersEmails,
                    FiveXFiveUsersEmails.email_id == FiveXFiveEmails.id,
                )
                .join(
                    FiveXFiveUser,
                    FiveXFiveUser.id == FiveXFiveUsersEmails.user_id,
                )
                .join(
                    LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id
                )
                .filter(LeadUser.id == lead_users_id)
                .all()
            )

            if not five_x_five_emails:
                data_sync_imported_lead.status = "incorrect_format"
                continue

            has_verified = False
            has_failed = False

            for email_row in five_x_five_emails:
                email = email_row.email
                is_verify = (
                    session.query(LeadEmailsVerification.is_verify)
                    .filter(LeadEmailsVerification.email == email)
                    .scalar()
                )

                if is_verify is True:
                    has_verified = True
                elif is_verify is False:
                    has_failed = True

            if has_verified:
                data_sync_imported_lead.status = "success"
            elif has_failed:
                data_sync_imported_lead.status = "verify_email_failed"
            else:
                data_sync_imported_lead.status = "incorrect_format"

        session.commit()
        logging.info("End")

    except Exception as e:
        session.rollback()
        logging.error(f"Ошибка обновления: {e}")

    finally:
        session.close()
