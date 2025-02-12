from bigcommerce.api import BigcommerceApi
from datetime import datetime
import os
import requests

STORE_HASH = "23k6mb4fr5"
ACCESS_TOKEN = "rsv2hj5p5cei9q6pie4epwnmhmj4ixo"
api = BigcommerceApi(
    store_hash=STORE_HASH,
    client_id='1m5fy4aqtify7q58hout6rsqwnibyy8',
    access_token=ACCESS_TOKEN
)

LOYAL_CATEGORY_THRESHOLD = 3  # Пример: Частые покупки в одной категории
HIGH_LTV_THRESHOLD = 3000  # Пример: Порог для High LTV
HIGH_AOV_THRESHOLD = 50  # Пример: Порог для High AOV
RECENT_PURCHASE_DAYS = 30  # Порог по времени для недавних покупателей
FREQUENT_PURCHASE_THRESHOLD = 2  # Минимум покупок в месяц для частых покупателей

LOOKALIKE_AUDIENCE_THRESHOLDS = {
    "Almost identical": (0, 3),
    "Extremely Similar": (0, 7),
    "Very similar": (0, 10),
    "Quite similar": (0, 15),
    "Broad": (0, 20)
}
        
current_date = datetime.now()

def filter_loyal_category_customer(categories_purchased):
    return any(count >= LOYAL_CATEGORY_THRESHOLD for category, count in categories_purchased.items())

def filter_high_ltv_customer(total_spend):
    return total_spend >= HIGH_LTV_THRESHOLD

def filter_frequent_customer(purchase_count):
    return purchase_count >= FREQUENT_PURCHASE_THRESHOLD

def filter_recent_customer(last_purchase_date):
    return (current_date - last_purchase_date).days <= RECENT_PURCHASE_DAYS

def filter_high_aov_customer(total_spend, purchase_count):
    average_order_value = total_spend / purchase_count if purchase_count else 0
    return average_order_value >= HIGH_AOV_THRESHOLD

def filter_lookalike_size(customer_similarity_score, lookalike_size):
    min_percentage, max_percentage = LOOKALIKE_AUDIENCE_THRESHOLDS.get(lookalike_size, (0, 0))
    return min_percentage <= customer_similarity_score <= max_percentage

orders = api.Orders.all(limit=250)
product_customer_details = []
for order in orders:
    
    customer_id = order["customer_id"]
    if not customer_id or customer_id == 0:
        continue
    
    try:
        customer_info = api.Customers.get(customer_id)  # Получение информации о клиенте
    except Exception as e:
        print(f"Error fetching customer info for customer_id {customer_id}: {e}")
        continue
    
    if not customer_info:
        continue  # Пропустить, если информация о клиенте отсутствует
    
    total_spend = 0
    purchase_count = 0
    last_purchase_date = None
    categories_purchased = {}
    customer_similarity_score = 5
    if order["custom_status"] in ('Pending', 'Awaiting Payment', 'Declined', 'Cancelled', 'Refunded', 'Incomplete', 
                                  'Awaiting Fulfillment', 'Disputed', 'Partially Refunded'):
        continue
    print(order)
    consignments_url = order["consignments"]["url"]
    try:
        response = requests.get(
            consignments_url,
            headers={
                "X-Auth-Token": ACCESS_TOKEN,
                "Accept": "application/json"
            }
        )
        response.raise_for_status()
        consignments_data = response.json()
        print('------')
        print(consignments_data)
    except Exception as e:
        print(f"Error fetching consignments data for order {order['id']}: {e}")
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
                        "X-Auth-Token": ACCESS_TOKEN,
                        "Accept": "application/json"
                    }
                )
                item_response.raise_for_status()
                item_data = item_response.json()
                print('--------')
                print(item_data)
                exit()
            except Exception as e:
                print(f"Error fetching item data for URL {item_url}: {e}")
                continue
            
            product_id = item_data.get("product_id")
            if not product_id:
                continue 
            
            try:
                product_info = api.Products.get(product_id)
            except Exception as e:
                print(f"Error fetching product info for product_id {product_id}: {e}")
                continue
            total_spend += float(product_info["price"])
            purchase_count += 1 
            
            # Обработка категорий товара
            if product_info["categories"]:
                for category_id in product_info["categories"]:
                    categories_purchased[category_id] = categories_purchased.get(category_id, 0) + 1
        
        # Обработка даты заказа
        order_date_str = order["date_created"]
        if order_date_str:
            try:
                order_date = datetime.strptime(order_date_str, '%a, %d %b %Y %H:%M:%S +0000')
                last_purchase_date = max(last_purchase_date or order_date, order_date)
            except ValueError as e:
                print(f"Error parsing date for order {order['id']}: {e}")
    
    product_customer_details.append({
        "customer": customer_info,
        "total_spend": total_spend,
        "purchase_count": purchase_count,
        "categories_purchased": categories_purchased,
        "last_purchase_date": last_purchase_date
    })

print(product_customer_details)
