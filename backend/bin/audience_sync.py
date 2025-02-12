import logging
import os
import sys
import asyncio
import functools
import json
import os
import sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from sqlalchemy import create_engine
from dotenv import load_dotenv
from models.audience import Audience
from models.integrations.users_domains_integrations import UserIntegration
from sqlalchemy.orm import sessionmaker, Session
from aio_pika import IncomingMessage
from config.rmq_connection import RabbitMQConnection
from bigcommerce.api import BigcommerceApi
from utils import get_utc_aware_date
from datetime import datetime
import requests
load_dotenv()

AUDIENCE_SYNC = 'audience_sync'
LOYAL_CATEGORY_THRESHOLD = 3  # Пример: Частые покупки в одной категории
HIGH_LTV_THRESHOLD = 3000  # Пример: Порог для High LTV
HIGH_AOV_THRESHOLD = 50  # Пример: Порог для High AOV
RECENT_PURCHASE_DAYS = 30  # Порог по времени для недавних покупателей
FREQUENT_PURCHASE_THRESHOLD = 2  # Минимум покупок в месяц для частых покупателей

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def filter_loyal_category_customer(categories_purchased):
    return any(count >= LOYAL_CATEGORY_THRESHOLD for category, count in categories_purchased.items())

def filter_high_ltv_customer(total_spend):
    return total_spend >= HIGH_LTV_THRESHOLD

def filter_frequent_customer(purchase_count):
    return purchase_count >= FREQUENT_PURCHASE_THRESHOLD

def filter_recent_customer(last_purchase_date):
    current_date = get_utc_aware_date
    return (current_date - last_purchase_date).days <= RECENT_PURCHASE_DAYS

def filter_high_intent_visitor(pages_visited, avg_time_on_site, product_page_time):
    if pages_visited > 3 and avg_time_on_site > 60:
        return True
    if product_page_time > 60:
        return True
    return False

def filter_returning_visitor(first_visit_date, last_visit_date):
    if (last_visit_date - first_visit_date).days <= 30:
        return True
    return False

def filter_abandoned_cart_visitor(cart_items, checkout_status, last_cart_update):
    if cart_items > 0 and checkout_status != 'Completed' and (get_utc_aware_date - last_cart_update).days <= 1:
        return True
    return False

def filter_high_aov_customer(total_spend, purchase_count):
    average_order_value = total_spend / purchase_count if purchase_count else 0
    return average_order_value >= HIGH_AOV_THRESHOLD

def filter_lookalike_size(customer_similarity_score, lookalike_size):
    min_percentage = 0
    max_percentage = lookalike_size
    return min_percentage <= customer_similarity_score <= max_percentage

def bigcommerce_process(store_hash, access_token, audience_type, audience_threshold):
    api = BigcommerceApi(
        store_hash=store_hash,
        client_id=os.getenv('BIGCOMMERCE_CLIENT_ID'),
        access_token=access_token
    )
    
    orders = api.Orders.all(limit=250)
    product_customer_details = []
    for order in orders:
        customer_id = order["customer_id"]
        if not customer_id or customer_id == 0:
            continue
        try:
            customer_info = api.Customers.get(customer_id)
        except Exception as e:
            logging.error(f"Error fetching customer info for customer_id {customer_id}: {e}")
            continue
        
        if not customer_info:
            continue
        
        total_spend = 0
        purchase_count = 0
        first_visit_date = None
        last_visit_date = None
        categories_purchased = {}
        customer_similarity_score = 5
        if order["custom_status"] in ('Pending', 'Awaiting Payment', 'Declined', 'Cancelled', 'Refunded', 'Incomplete', 
                                    'Awaiting Fulfillment', 'Disputed', 'Partially Refunded'):
            continue
        
        consignments_url = order["consignments"]["url"]
        try:
            response = requests.get(
                consignments_url,
                headers={
                    "X-Auth-Token": access_token,
                    "Accept": "application/json"
                }
            )
            response.raise_for_status()
            consignments_data = response.json()
        except Exception as e:
            logging.error(f"Error fetching consignments data for order {order['id']}: {e}")
            continue
        
        for consignment in consignments_data.get("shipping", []):
            for item in consignment.get("line_items", []):
                item_url = item.get("url")
                if not item_url:
                    continue
                try:
                    item_response = requests.get(
                        item_url,
                        headers={
                            "X-Auth-Token": access_token,
                            "Accept": "application/json"
                        }
                    )
                    item_response.raise_for_status()
                    item_data = item_response.json()
                except Exception as e:
                    logging.error(f"Error fetching item data for URL {item_url}: {e}")
                    continue
                product_id = item_data.get("product_id")
                if not product_id:
                    continue 
                try:
                    product_info = api.Products.get(product_id)
                except Exception as e:
                    logging.error(f"Error fetching product info for product_id {product_id}: {e}")
                    continue
                total_spend += float(product_info["price"])
                purchase_count += 1 
                if product_info["categories"]:
                    for category_id in product_info["categories"]:
                        categories_purchased[category_id] = categories_purchased.get(category_id, 0) + 1
            
            order_date_str = order["date_created"]
            if order_date_str:
                try:
                    order_date = datetime.strptime(order_date_str, '%a, %d %b %Y %H:%M:%S +0000')
                    if not first_visit_date:
                        first_visit_date = order_date
                    last_visit_date = max(last_visit_date or order_date, order_date)
                except ValueError as e:
                    logging.error(f"Error parsing date for order {order['id']}: {e}")
                    
        if audience_type == 'Loyal category customer' and not filter_loyal_category_customer(categories_purchased):
           continue 
        if audience_type == 'High LTV customer' and not filter_high_ltv_customer(total_spend):
           continue
        if audience_type == 'Frequent customer' and not filter_frequent_customer(purchase_count):
            continue
        if audience_type == 'Recent customer' and not filter_recent_customer(last_visit_date):
            continue
        if audience_type == 'High AOV customer' and not filter_high_aov_customer(total_spend, purchase_count):
            continue
        
        if audience_type == 'High Intent Visitor' and not filter_high_intent_visitor(pages_visited, avg_time_on_site, product_page_time):
            continue
        if audience_type == 'Returning Visitor' and not filter_returning_visitor(first_visit_date, last_visit_date):
            continue
        if audience_type == 'Abandoned Cart Visitor' and not filter_abandoned_cart_visitor(cart_items, checkout_status, last_cart_update):
            continue
        
        if not filter_lookalike_size(customer_similarity_score, audience_threshold):
            continue
        
        product_customer_details.append({
            "customer": customer_info,
            "total_spend": total_spend,
            "purchase_count": purchase_count,
            "categories_purchased": categories_purchased,
            "last_purchase_date": last_visit_date
        })
        
    return product_customer_details
    
async def audience_process(message: IncomingMessage, session: Session):
    try:       
        logging.info(f"Start audience process")
        message_body = json.loads(message.body)
        domain_id = message_body.get('domain_id')
        audience_id = message_body.get('audience_id')
        data_source = message_body.get('data_source')
        audience_type = message_body.get('audience_type')
        audience_threshold = message_body.get('audience_threshold')
        result_process = None
        if data_source == 'bigcommerce':
            user_integration = session.query(UserIntegration) \
            .filter((UserIntegration.id == domain_id) & (UserIntegration.service_name == data_source)) \
            .first()
            result_process = bigcommerce_process(user_integration.shop_domain, user_integration.access_token, audience_type, audience_threshold)
        if result_process:
            audience = session.query(Audience).filter(Audience.id == audience_id).first()
            if audience:
                audience.status = 'success'
                session.db.commit()
    except Exception as e:
        logging.error("Error processing message", exc_info=True)
        await asyncio.sleep(5)
        await message.reject(requeue=True)

    
async def main():
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == 'DEBUG':
            log_level = logging.DEBUG
        elif arg != 'INFO':
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")
    
    setup_logging(log_level)
    db_username = os.getenv('DB_USERNAME')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')

    try:
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        queue = await channel.declare_queue(
            name=AUDIENCE_SYNC,
            durable=True,
        )
        engine = create_engine(
            f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        session = Session()
        await queue.consume(
            functools.partial(audience_process, session=session)
        )
        await asyncio.Future()

    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)

    finally:
        if session:
            logging.info("Closing the database session...")
            session.close()
        if rabbitmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())