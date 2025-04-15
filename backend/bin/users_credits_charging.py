import asyncio
import functools
import json
import logging
import os
import sys
from collections import defaultdict

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
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker, aliased
from services.subscriptions import SubscriptionService
from models.users import Users
from models.five_x_five_users import FiveXFiveUser
from datetime import datetime, timezone
from models.users_unlocked_5x5_users import UsersUnlockedFiveXFiveUser
from services.stripe_service import purchase_product
from dependencies import (PlansPersistence)
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


async def on_message_received(message, session, subscription_service):
    try:
        message_json = json.loads(message.body)
        customer_id = message_json.get('customer_id')
        plan_id = message_json.get('plan_id')
        
        
        ContactCredits = aliased(SubscriptionPlan)
        stmt = select(
            ContactCredits.price.label('price'),
            ContactCredits.stripe_price_id.label('stripe_price_id')
        ).join(
            SubscriptionPlan, SubscriptionPlan.contact_credit_plan_id == ContactCredits.id
        ).where(
            SubscriptionPlan.id == plan_id
        )
        
        contact_credits = session.execute(stmt).first()
        
        user = session.query(Users).filter_by(customer_id=customer_id).first()
        
        if not subscription_service.is_user_has_active_subscription(user.id):
            logging.info(f"Skip, subscription is not active for user {user.id}")
            await message.ack()
            return
        
        if not user or not contact_credits:
            logging.error("Invalid user or subscription plan", extra={'customer_id': customer_id, 'plan_id': plan_id})
            await message.ack()
            return

        lead_users = (
            session.query(LeadUser)
            .filter_by(user_id=user.id, is_active=False)
            .order_by(LeadUser.created_at)
            .all()
        )

        lead_user_count = len(lead_users)
        if lead_user_count <= 0:
            logging.info(f"There are no blocked contacts here")
            await message.ack()
            return
        
        logging.info(f"user.leads_credits = {user.leads_credits}")
        logging.info(f"lead_user_count: {lead_user_count}")
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
                    logging.info(f"{user.full_name} charge {QUANTITY} leads by {contact_credits.price}")
                    result = purchase_product(customer_id, contact_credits.stripe_price_id, QUANTITY,
                                                'leads_credits')
                    if result['success']:
                        stripe_payload = result['stripe_payload']
                        transaction_id = stripe_payload.get("id")
                        if not session.query(UsersUnlockedFiveXFiveUser).filter_by(
                                transaction_id=transaction_id).first():
                            created_timestamp = stripe_payload.get("created")
                            created_at = datetime.fromtimestamp(created_timestamp,
                                                                timezone.utc) if created_timestamp else None
                            status = stripe_payload.get("status")
                            logging.info(f"payment status {status}")
                            if status == 'succeeded':
                                grouped_users = defaultdict(list)
                                
                                lead_subset = lead_users[:QUANTITY]
                                five_x_five_ids = [user.five_x_five_user_id for user in lead_subset]

                                id_up_pairs = (
                                    session
                                    .query(FiveXFiveUser.id, FiveXFiveUser.up_id)
                                    .filter(FiveXFiveUser.id.in_(five_x_five_ids))
                                    .all()
                                )
                                id_to_up = dict(id_up_pairs)
                                grouped_users = defaultdict(list)
                                for u in lead_subset:
                                    up = id_to_up.get(u.five_x_five_user_id)
                                    grouped_users[u.domain_id].append(up)
                                
                                transaction_dicts = []
                                for domain_id, up_ids in grouped_users.items():
                                    for up_id in up_ids:
                                        transaction_dicts.append({
                                            'user_id': user.id,
                                            'transaction_id': str(transaction_id),
                                            'created_at': datetime.now(timezone.utc),
                                            'updated_at': datetime.now(timezone.utc),
                                            'stripe_request_created_at': created_at,
                                            'status': status,
                                            'amount_credits': contact_credits.price,
                                            'type': 'buy_leads',
                                            'domain_id': domain_id,
                                            'five_x_five_up_id': up_id,
                                        })

                                session.bulk_insert_mappings(
                                    UsersUnlockedFiveXFiveUser,
                                    transaction_dicts
                                )
                                session.commit()
                                
                                session.query(LeadUser).filter(
                                    LeadUser.id.in_([user.id for user in lead_subset])) \
                                    .update({"is_active": True}, synchronize_session=False)
                                session.commit()
                                logging.error(f"Purchase success")
                    else:
                        logging.error(f"Purchase failed: {result['error']}", exc_info=True)
                        account_notification = await get_account_notification_by_title(session, NotificationTitles.PAYMENT_FAILED.value)
                        user_account_notification = await save_account_notification(session, user.id,
                                                                                account_notification.id)
                        queue_name = f'sse_events_{str(user.id)}'
                        rabbitmq_connection = RabbitMQConnection()
                        connection = await rabbitmq_connection.connect()
                        try:
                            await publish_rabbitmq_message(
                                connection=connection,
                                queue_name=queue_name,
                                message_body={'notification_text': account_notification.text,
                                                'notification_id': user_account_notification.id}
                            )
                        except:
                            await rabbitmq_connection.close()
                        finally:
                            await rabbitmq_connection.close()

        logging.info(f"message ack")
        await message.ack()
    except Exception as e:
        logging.error(f"Error occurred while processing message: {e}", exc_info=True)
        session.rollback()
        await asyncio.sleep(5)
        await message.ack()


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
        subscription_service = SubscriptionService(
                    plans_persistence = PlansPersistence(db_session),
                    user_persistence_service = None,
                    referral_service = None,
                    partners_persistence = None,
                    db=db_session,
                )
        await queue.consume(
            functools.partial(on_message_received, session=db_session, subscription_service=subscription_service)
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
