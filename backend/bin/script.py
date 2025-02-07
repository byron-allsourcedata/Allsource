from bigcommerce.api import BigcommerceApi

STORE_HASH = ""
ACCESS_TOKEN = ""
CLIENT_ID = ""

api = BigcommerceApi(
    store_hash=STORE_HASH,
    client_id=CLIENT_ID,
    access_token=ACCESS_TOKEN
)

orders = api.Orders.all(limit=250)
product_customer_details = []
print(orders)
# for order in orders:
#     customer_id = order["customer_id"]
#     customer_info = api.Customers.get(customer_id)
    
#     for item in order["products"]:
#         product_id = item["product_id"]
#         product_info = api.Products.get(product_id)
        
#         product_customer_details.append({
#             "customer": customer_info,
#             "product": product_info
#         })

# print(product_customer_details)
