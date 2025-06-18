import logging
import os
import sys
from datetime import datetime, timezone
from sqlalchemy import update, select

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models import Users, UserSubscriptions, SubscriptionPlan
from utils import end_of_month
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

logging.basicConfig(level=logging.INFO)


def refresh_lead_credits(db_session: Session):
    credits = (
        db_session.query(SubscriptionPlan.leads_credits)
        .filter(SubscriptionPlan.is_free_trial == True)
        .scalar()
    )

    if credits is None:
        logging.error("Free trial plan not found")
        return

    subquery_user_sub_ids = (
        select(Users.current_subscription_id)
        .join(
            UserSubscriptions,
            Users.current_subscription_id == UserSubscriptions.id,
        )
        .join(
            SubscriptionPlan, SubscriptionPlan.id == UserSubscriptions.plan_id
        )
        .filter(SubscriptionPlan.is_free_trial == True)
        .scalar_subquery()
    )

    stmt_users = (
        update(Users)
        .where(Users.current_subscription_id.in_(subquery_user_sub_ids))
        .values(leads_credits=credits)
    )
    result_users = db_session.execute(stmt_users)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    stmt_subs = (
        update(UserSubscriptions)
        .where(UserSubscriptions.id.in_(subquery_user_sub_ids))
        .values(plan_end=end_of_month(now))
    )

    result_subs = db_session.execute(stmt_subs)
    db_session.commit()

    logging.info(
        f"Updated {result_users.rowcount} users and {result_subs.rowcount} subscriptions for free trial."
    )


def main():
    logging.info("Started")
    db_session = None
    try:
        engine = create_engine(
            f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}",
            pool_pre_ping=True,
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()
        refresh_lead_credits(db_session=db_session)

    except Exception as err:
        logging.error(f"Unhandled Exception: {err}", exc_info=True)
        db_session.rollback()
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    main()
