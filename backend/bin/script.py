from bigcommerce.api import BigcommerceApi
import datetime

STORE_HASH = "23k6mb4fr5"
ACCESS_TOKEN = "mge35t14mqrh1cy44l34d2hu0ea4s3t"
CLIENT_ID = "bues9uk2dxgeeh86123472ux2y4tl40"

api = BigcommerceApi(
    store_hash=STORE_HASH,
    client_id=CLIENT_ID,
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

current_date = datetime.datetime.now()

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

filters = {
    "Loyal Category Customer": filter_loyal_category_customer,
    "High LTV Customer": filter_high_ltv_customer,
    "Frequent Customer": filter_frequent_customer,
    "Recent Customer": filter_recent_customer,
    "High AOV Customer": filter_high_aov_customer,
    "Lookalike Audience": filter_lookalike_size
}

orders = api.Orders.all(limit=250)

product_customer_details = []

for order in orders:
    customer_id = order["customer_id"]
    customer_info = api.Customers.get(customer_id)

    total_spend = 0
    purchase_count = 0
    last_purchase_date = None
    categories_purchased = {}
    customer_similarity_score = 5 

    for item in order["products"]:
        product_id = item["product_id"]
        product_info = api.Products.get(product_id)

        total_spend += item["price"]

        category_id = product_info["categories"][0]
        if category_id not in categories_purchased:
            categories_purchased[category_id] = 0
        categories_purchased[category_id] += 1

        order_date = datetime.datetime.strptime(order["date_created"], '%Y-%m-%dT%H:%M:%S')
        if not last_purchase_date or order_date > last_purchase_date:
            last_purchase_date = order_date

    filter_loyal_category_customer(categories_purchased)
    # filter_high_ltv_customer(total_spend)
    # filter_frequent_customer(purchase_count)
    # filter_recent_customer(last_purchase_date)
    # filter_high_aov_customer(total_spend, purchase_count)
    # filter_lookalike_size(customer_similarity_score, 'Almost identical')
    
    product_customer_details.append({
        "customer": customer_info,
        "product": product_info,
        "total_spend": total_spend
    })
    
print(product_customer_details)
