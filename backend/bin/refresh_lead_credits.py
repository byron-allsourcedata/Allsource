import asyncio
import logging
import os
import sys

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from persistence.user_persistence import UserPersistence
from persistence.user_subscriptions import UserSubscriptionsPersistence
from resolver import Resolver
from db_dependencies import Db

from enums import PlanAlias
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.INFO)


def refresh_free_trail_lead_credits(db_session: Session, user_subscriptions_persistence: UserSubscriptionsPersistence, user_persistence: UserPersistence):
    credits = user_subscriptions_persistence.get_lead_credits(PlanAlias.FREE_TRIAL.value)

    if credits is None:
        logging.error("Free trial plan not found")
        return

    subquery_user_sub_ids = user_subscriptions_persistence.subquery_current_free_trial_sub_ids(PlanAlias.FREE_TRIAL.value)
    result_users = user_persistence.update_users_credits(subquery_user_sub_ids, credits)
    result_subs= user_persistence.update_subscriptions_dates(subquery_user_sub_ids)
    db_session.commit()

    logging.info(
        f"Updated {result_users.rowcount} users and {result_subs.rowcount} subscriptions for free trial."
    )


def refresh_basic_lead_credits(db_session: Session, user_subscriptions_persistence: UserSubscriptionsPersistence, user_persistence: UserPersistence):
    credits = user_subscriptions_persistence.get_lead_credits(PlanAlias.BASIC.value)

    if credits is None:
        logging.error("Basic plan not found")
        return

    subquery_user_sub_ids = user_subscriptions_persistence.subquery_current_free_trial_sub_ids(
        PlanAlias.BASIC.value
    )

    result_users = user_persistence.update_users_credits(subquery_user_sub_ids, credits)
    result_subs = user_persistence.update_subscriptions_dates(subquery_user_sub_ids)

    db_session.commit()

    logging.info(
        f"Updated {result_users.rowcount} users and {result_subs.rowcount} subscriptions for basic."
    )


async def main():
    logging.info("Started")
    db_session = None

    resolver = Resolver()
    try:
        db_session = await resolver.resolve(Db)
        user_subscriptions_persistence = await resolver.resolve(UserSubscriptionsPersistence)
        user_persistence = await resolver.resolve(
            UserPersistence
        )
        refresh_free_trail_lead_credits(db_session=db_session, user_subscriptions_persistence=user_subscriptions_persistence, user_persistence=user_persistence)
        refresh_basic_lead_credits(db_session=db_session, user_subscriptions_persistence=user_subscriptions_persistence, user_persistence=user_persistence)

    except Exception as err:
        logging.error(f"Unhandled Exception: {err}", exc_info=True)
        db_session.rollback()
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())
