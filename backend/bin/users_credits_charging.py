import asyncio
import functools
import json
import logging
import os
import sys
from collections import defaultdict

from sqlalchemy import create_engine

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models.plans import SubscriptionPlan
from models.users_domains import UserDomains
from enums import NotificationTitles
from models.account_notification import AccountNotification
from models.users_account_notification import UserAccountNotification
from models.leads_users import LeadUser
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from sqlalchemy.orm import sessionmaker
from models.users import Users
from datetime import datetime, timezone
from models.users_unlocked_5x5_users import UsersUnlockedFiveXFiveUser
from services.stripe_service import purchase_product
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

QUEUE_CREDITS_CHARGING = 'credits_charging'
EMAIL_NOTIFICATIONS = 'email_notifications'
QUANTITY = 100


async def get_account_notification_by_title(session, title: str) -> str:
    return session.query(AccountNotification).filter(AccountNotification.title == title).first()


async def save_account_notification(session, user_id, account_notification_id, params=None):
    account_notification = UserAccountNotification(
        user_id=user_id,
        notification_id=account_notification_id,
        params=str(params)
    )
    session.add(account_notification)
    session.commit()
    return account_notification


async def on_message_received(message, session):
    try:
        message_json = json.loads(message.body)
        customer_id = message_json.get('customer_id')
        plan_id = message_json.get('plan_id')
        account_notification = await get_account_notification_by_title(session, NotificationTitles.PAYMENT_FAILED.value)
        message_text = account_notification.text
        subscription_plan = session.query(SubscriptionPlan).filter_by(id=plan_id).first()
        user = session.query(Users).filter_by(customer_id=customer_id).first()

        if not user or not subscription_plan:
            logging.error("Invalid user or subscription plan", extra={'customer_id': customer_id, 'plan_id': plan_id})
            await message.reject(requeue=True)
            return

        lead_users = (
            session.query(LeadUser)
            .filter_by(user_id=user.id, is_active=False)
            .order_by(LeadUser.created_at)
            .all()
        )

        lead_user_count = len(lead_users)
        logging.info(f"lead_user_count: {lead_user_count}")
        if lead_user_count > 0:
            logging.info(f"lead_user_count > 0")
            logging.info(f"user.leads_credits = {user.leads_credits}")
            if user.leads_credits > 0:
                logging.info(f"leads_credits > 0")
                activate_count = min(user.leads_credits, lead_user_count)
                session.query(LeadUser).filter(
                    LeadUser.id.in_([user.id for user in lead_users[:activate_count]])) \
                    .update({"is_active": True}, synchronize_session=False)

                user.leads_credits -= activate_count
                session.commit()
            else:
                if user.is_leads_auto_charging:
                    logging.info(f"is_leads_auto_charging true")
                    if lead_user_count >= QUANTITY:
                        result = purchase_product(customer_id, subscription_plan.stripe_price_id, QUANTITY,
                                                  'leads_credits')
                        if result['success']:
                            stripe_payload = result['stripe_payload']
                            transaction_id = stripe_payload.get("id")
                            if not session.query(UsersPaymentsTransactions).filter_by(
                                    transaction_id=transaction_id).first():
                                created_timestamp = stripe_payload.get("created")
                                created_at = datetime.fromtimestamp(created_timestamp,
                                                                    timezone.utc) if created_timestamp else None
                                status = stripe_payload.get("status")
                                logging.info(f"payment status {status}")
                                if status == 'succeeded':
                                    grouped_users = defaultdict(list)
                                    for lead_user in lead_users[:QUANTITY]:
                                        grouped_users[lead_user.domain_id].append(lead_user)
                                    transaction_counter = 1
                                    for domain_id, users in grouped_users.items():
                                        transaction_id_with_iteration = f"{transaction_id}_{transaction_counter}"
                                        payment_transaction_obj = UsersPaymentsTransactions(
                                            user_id=user.id,
                                            transaction_id=transaction_id_with_iteration,
                                            created_at=datetime.now(timezone.utc),
                                            stripe_request_created_at=created_at,
                                            status=status,
                                            amount_credits=QUANTITY // len(grouped_users),
                                            type='buy_leads',
                                            domain_id=domain_id
                                        )
                                        session.add(payment_transaction_obj)
                                        session.flush()
                                        transaction_counter += 1

                                    session.query(LeadUser).filter(
                                        LeadUser.id.in_([user.id for user in lead_users[:QUANTITY]])) \
                                        .update({"is_active": True}, synchronize_session=False)
                                    session.commit()
                        else:
                            logging.error(f"Purchase failed: {result['error']}", exc_info=True)

                        account_notification = await save_account_notification(session, user.id,
                                                                               account_notification.id)

                        queue_name = f'sse_events_{str(user.id)}'
                        rabbitmq_connection = RabbitMQConnection()
                        connection = await rabbitmq_connection.connect()
                        try:
                            await publish_rabbitmq_message(
                                connection=connection,
                                queue_name=queue_name,
                                message_body={'notification_text': message_text,
                                              'notification_id': account_notification.id}
                            )
                        except:
                            await rabbitmq_connection.close()
                        finally:
                            await rabbitmq_connection.close()

        logging.info(f"message ack")
        await message.ack()
    except Exception as e:
        logging.error("Error occurred while processing message.", exc_info=True)
        session.rollback()
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
            name=QUEUE_CREDITS_CHARGING,
            durable=True,
            arguments={
                'x-consumer-timeout': 3600000,
            }
        )

        await channel.declare_queue(
            name=EMAIL_NOTIFICATIONS,
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
