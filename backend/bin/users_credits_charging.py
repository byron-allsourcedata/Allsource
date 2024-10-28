import asyncio
import functools
import json
import logging
import os
import sys

from sqlalchemy import create_engine


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models.plans import SubscriptionPlan
from models.five_x_five_users import FiveXFiveUser
from models.leads_users import LeadUser
from config.rmq_connection import RabbitMQConnection
from sqlalchemy.orm import sessionmaker
from models.users import Users
from datetime import datetime, timezone
from models.users_payments_transactions import UsersPaymentsTransactions
from services.stripe_service import purchase_product
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

QUEUE_CREDITS_CHARGING = 'credits_charging'


async def on_message_received(message, session):
    try:
        message_json = json.loads(message.body)
        customer_id = message_json.get('customer_id')
        plan_id = message_json.get('plan_id')

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

        quantity = len(lead_users)

        if quantity > 0:
            if user.leads_credits > 0:
                activate_count = min(user.leads_credits, quantity)
                for lead_user in lead_users[:activate_count]:
                    lead_user.is_active = True
                user.leads_credits -= activate_count
                session.commit()
            else:
                if user.is_leads_auto_charging:
                    if quantity >= 100:
                        quantity -= 100
                        result = purchase_product(customer_id, subscription_plan.stripe_price_id, 100, 'leads_credits')
                        if result['success']:
                            stripe_payload = result['stripe_payload']
                            transaction_id = stripe_payload.get("id")
                            if not session.query(UsersPaymentsTransactions).filter_by(transaction_id=transaction_id).first():
                                created_timestamp = stripe_payload.get("created")
                                created_at = datetime.fromtimestamp(created_timestamp, timezone.utc) if created_timestamp else None
                                status = stripe_payload.get("status")

                                if status == 'succeeded':
                                    payment_transaction_obj = UsersPaymentsTransactions(
                                        user_id=user.id,
                                        transaction_id=transaction_id,
                                        created_at=datetime.now(timezone.utc),
                                        stripe_request_created_at=created_at,
                                        status=status,
                                        amount_credits=100,
                                        type='leads_credits'
                                    )
                                    session.add(payment_transaction_obj)
                                    session.flush()
                                    for lead_user in lead_users[:100]:
                                        lead_user.is_active = True
                                    session.commit()
                        else:
                            logging.error(f"Purchase failed: {result['error']}", exc_info=True)

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
