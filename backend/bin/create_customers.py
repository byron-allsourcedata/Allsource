import requests
import json
import random
from faker import Faker

STORE_HASH = "23k6mb4fr5"
ACCESS_TOKEN = "rsv2hj5p5cei9q6pie4epwnmhmj4ixo"
CLIENT_ID = "bues9uk2dxgeeh86123472ux2y4tl40"

# Initialize Faker for generating random data
fake = Faker()


# Example category IDs (replace these with your actual category IDs)
CATEGORY_IDS = [1, 2, 3, 4, 5]

# Create customer function
def create_customer(first_name, last_name, email, phone, street_1, street_2, city, state, zip, country, password):
    url = f'https://api.bigcommerce.com/stores/{STORE_HASH}/v3/customers'
    
    payload = [{
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "company": fake.company(),
        "phone": phone,
        "billing_addresses": [{
            "street_1": street_1,
            "street_2": street_2,
            "city": city,
            "state": state,
            "zip": zip,
            "country": country
        }],
        "password": password
    }]

    headers = {
        'X-Auth-Client': CLIENT_ID,
        'X-Auth-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
    }
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    
    if response.status_code in [200, 201]:
        print(f'Customer {first_name} {last_name} created successfully!')
        return response.json().get('data')[0].get('id')
    else:
        print(f'Error creating customer: {response.status_code} - {response.text}')
        return None

# Create an order function
def create_order(customer_id):
    valid_product_ids = [80, 81, 86, 88, 94, 97, 98, 103, 104, 107, 111]
    product_id = random.choice(valid_product_ids)
    
    url = f'https://api.bigcommerce.com/stores/{STORE_HASH}/v2/orders'
    
    payload = {
        "customer_id": customer_id,
        "status_id": 11,
        "billing_address": {
            "first_name": "John",
            "last_name": "Doe",
            "street_1": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zip": "10001",
            "country": "United States",
            "email": "john.doe@example.com",
            "phone": "1234567890"
        },
        "products": [{
            "product_id": product_id,
            "quantity": random.randint(1, 3)
        }]
    }
    
    headers = {
        'X-Auth-Client': CLIENT_ID,
        'X-Auth-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
    }
    

    response = requests.post(url, headers=headers, data=json.dumps(payload))
    
    if response.status_code == 201 or response.status_code == 200:
        print(f'Order for customer {customer_id} created successfully!')
        return response.text
    else:
        print(f'Error creating order: {response.status_code} - {response.text}')
        return None

# Simulate adding items to cart
def add_to_cart(customer_id):
    product_id = random.randint(1, 100)
    url = f'https://api.bigcommerce.com/stores/{STORE_HASH}/v3/carts'
    
    payload = {
        "customer_id": customer_id,
        "line_items": [{
            "product_id": product_id,
            "quantity": random.randint(1, 3)
        }]
    }

    headers = {
        'X-Auth-Client': CLIENT_ID,
        'X-Auth-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))
    
    if response.status_code == 200 or response.status_code == 201:
        print(f'Cart item added for customer {customer_id}')
        return response.json()
    else:
        print(f'Error adding to cart: {response.status_code} - {response.text}')
        return None

# Function to generate multiple customers with orders and cart activity
def generate_customers(num_customers=10):
    for _ in range(num_customers):
        first_name = fake.first_name()
        last_name = fake.last_name()
        email = fake.email()
        phone = fake.phone_number()
        street_1 = fake.street_address()
        street_2 = fake.secondary_address()
        city = fake.city()
        state = fake.state_abbr()
        zip = fake.zipcode()
        country = fake.country_code()
        password = fake.password()

        customer_id = create_customer(first_name, last_name, email, phone, street_1, street_2, city, state, zip, country, password)
        
        if customer_id:
                create_order(customer_id)

# Generate 200 customers
generate_customers(1000)