import requests
import json
import random
from faker import Faker

STORE_HASH = "23k6mb4fr5"
ACCESS_TOKEN = "mge35t14mqrh1cy44l34d2hu0ea4s3t"
CLIENT_ID = "bues9uk2dxgeeh86123472ux2y4tl40"

# BigCommerce API base URL
BASE_URL = f'https://api.bigcommerce.com/stores/{STORE_HASH}/v3/'

# Initialize Faker for generating random data
fake = Faker()

# Example category IDs (replace these with your actual category IDs)
CATEGORY_IDS = [1, 2, 3, 4, 5]

# Create customer function
def create_customer(first_name, last_name, email, phone, street_1, street_2, city, state, zip, country, password):
    url = f'{BASE_URL}customers'
    
    payload = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "company": fake.company(),
        "phone": phone,
        "billing_address": {
            "street_1": street_1,
            "street_2": street_2,
            "city": city,
            "state": state,
            "zip": zip,
            "country": country
        },
        "shipping_address": {
            "street_1": street_1,
            "street_2": street_2,
            "city": city,
            "state": state,
            "zip": zip,
            "country": country
        },
        "password": password
    }

    headers = {
        'X-Auth-Client': CLIENT_ID,
        'X-Auth-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))
    
    if response.status_code == 201:
        print(f'Customer {first_name} {last_name} created successfully!')
        return response.json()
    else:
        print(f'Error creating customer: {response.status_code} - {response.text}')
        return None

# Create an order function
def create_order(customer_id, has_purchased=True):
    if not has_purchased:
        return None  # If customer hasn't made a purchase, return nothing
    
    # Create a random order with a random category
    category_id = random.choice(CATEGORY_IDS)
    product_id = random.randint(1, 100)  # Replace with actual product IDs from your store
    
    url = f'{BASE_URL}orders'
    
    payload = {
        "customer_id": customer_id,
        "status_id": 11,  # Status "Completed" (change if needed)
        "products": [{
            "product_id": product_id,
            "quantity": 1
        }]
    }
    
    headers = {
        'X-Auth-Client': CLIENT_ID,
        'X-Auth-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))
    
    if response.status_code == 201:
        print(f'Order for customer {customer_id} created successfully!')
        return response.json()
    else:
        print(f'Error creating order: {response.status_code} - {response.text}')
        return None

# Function to generate multiple customers with orders
def generate_customers(num_customers=10):
    customers = []
    
    for _ in range(num_customers):
        # Generate fake customer data
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

        # Create customer
        customer = create_customer(first_name, last_name, email, phone, street_1, street_2, city, state, zip, country, password)
        
        if customer:
            customers.append(customer)
            
            # Randomly decide if the customer has purchased something
            has_purchased = random.choice([True, False])
            
            # Create order if the customer has purchased something
            create_order(customer['id'], has_purchased)
    
    return customers

# Generate 10 customers as an example
generate_customers(10)
