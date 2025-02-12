import logging
import os
import sys
import asyncio
import functools
import json
from datetime import datetime
from typing import Dict, List, Optional
from collections import defaultdict
import aiohttp
import requests
from aio_pika import IncomingMessage
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

from models.audience import Audience
from models.integrations.users_domains_integrations import UserIntegration
from config.rmq_connection import RabbitMQConnection
from bigcommerce.api import BigcommerceApi
from utils import get_utc_aware_date

load_dotenv()

AUDIENCE_SYNC = 'audience_sync'
LOYAL_CATEGORY_THRESHOLD = 3
HIGH_LTV_THRESHOLD = 3000
HIGH_AOV_THRESHOLD = 50
RECENT_PURCHASE_DAYS = 30
FREQUENT_PURCHASE_THRESHOLD = 2

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def filter_loyal_category_customer(categories_purchased: Dict[int, int]) -> bool:
    return any(count >= LOYAL_CATEGORY_THRESHOLD for count in categories_purchased.values())

def filter_high_ltv_customer(total_spend: float) -> bool:
    return total_spend >= HIGH_LTV_THRESHOLD

def filter_frequent_customer(purchase_count: int) -> bool:
    return purchase_count >= FREQUENT_PURCHASE_THRESHOLD

def filter_recent_customer(last_purchase_date: datetime) -> bool:
    return (get_utc_aware_date() - last_purchase_date).days <= RECENT_PURCHASE_DAYS

def filter_high_aov_customer(total_spend: float, purchase_count: int) -> bool:
    average_order_value = total_spend / purchase_count if purchase_count else 0
    return average_order_value >= HIGH_AOV_THRESHOLD

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

async def fetch_consignments_data(consignments_url: str, access_token: str) -> Optional[dict]:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                consignments_url,
                headers={
                    "X-Auth-Token": access_token,
                    "Accept": "application/json"
                }
            ) as response:
                response.raise_for_status()
                return await response.json()
    except Exception as e:
        logging.error(f"Error fetching consignments data: {e}")
        return None

async def fetch_item_data(item_url: str, access_token: str) -> Optional[dict]:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                item_url,
                headers={
                    "X-Auth-Token": access_token,
                    "Accept": "application/json"
                }
            ) as response:
                response.raise_for_status()
                return await response.json()
    except Exception as e:
        logging.error(f"Error fetching item data: {e}")
        return None

def filter_lookalike_size(customer_similarity_score, lookalike_size):
    min_percentage = 0
    max_percentage = lookalike_size
    return min_percentage <= customer_similarity_score <= max_percentage

async def bigcommerce_process(store_hash: str, access_token: str, audience_type: str, audience_threshold: float) -> List[dict]:
    api = BigcommerceApi(
        store_hash=store_hash,
        client_id=os.getenv('BIGCOMMERCE_CLIENT_ID'),
        access_token=access_token
    )
    
    orders = api.Orders.all(limit=250)
    customer_orders = defaultdict(lambda: {
        "customer": None,
        "total_spend": 0,
        "purchase_count": 0,
        "categories_purchased": defaultdict(int),
        "last_visit_date": None
    })
    
    for order in orders:
        customer_id = order.get("customer_id")
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
        pages_visited = 0  # Пример: количество посещенных страниц
        avg_time_on_site = 0  # Пример: среднее время на сайте
        product_page_time = 0  # Пример: время на странице продукта
        cart_items = 0  # Пример: количество товаров в корзине
        checkout_status = order["custom_status"]  # Пример: статус оформления заказа
        last_cart_update = None  # Пример: время последнего обновления корзины
        customer_similarity_score = 5
        
        if order["custom_status"] in ('Pending', 'Awaiting Payment', 'Declined', 'Cancelled', 'Refunded', 'Incomplete', 
                                    'Awaiting Fulfillment', 'Disputed', 'Partially Refunded'):
            continue
        
        consignments_url = order["consignments"]["url"]
        consignments_data = await fetch_consignments_data(consignments_url, access_token)
        if not consignments_data:
            continue
        
        for consignment in consignments_data.get("shipping", []):
            for item in consignment.get("line_items", []):
                item_url = item.get("url")
                if not item_url:
                    continue
                
                item_data = await fetch_item_data(item_url, access_token)
                if not item_data:
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
        
        # if not filter_lookalike_size(customer_similarity_score, audience_threshold):
        #     continue
        
        customer_data = customer_orders[customer_id]
        customer_data["total_spend"] += total_spend
        customer_data["purchase_count"] += purchase_count
        customer_data["last_visit_date"] = max(customer_data["last_purchase_date"] or last_visit_date, last_visit_date)

        for category, count in categories_purchased.items():
            customer_data["categories_purchased"][category] += count

        if not customer_data["customer"]:
            customer_data["customer"] = {
                'first_name': customer_info['first_name'],
                'last_name': customer_info['last_name'],
                'email': customer_info['email'],
                'phone': customer_info['phone'],
                'date_created': customer_info['date_created'],
                'date_modified': customer_info['date_modified'],
                'store_credit': customer_info['store_credit'],
                'registration_ip_address': customer_info['registration_ip_address'],
                'customer_group_id': customer_info['customer_group_id'],
                'tax_exempt_category': customer_info['tax_exempt_category'],
                'reset_pass_on_login': customer_info['reset_pass_on_login'],
                'accepts_marketing': customer_info['accepts_marketing'],
            }
        
    return list(customer_orders.values())
    
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
            if user_integration:
                result_process = await bigcommerce_process(user_integration.shop_domain, user_integration.access_token, audience_type, audience_threshold)
        
        if result_process:
            audience = session.query(Audience).filter(Audience.id == audience_id).first()
            if audience:
                audience.status = 'success'
                session.commit()
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