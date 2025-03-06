#!/usr/bin/env python3
import logging
import os
import sys
import csv
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.five_x_five_users import FiveXFiveUser
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CSV_FILE_PATH = '5x5users_data.csv'

def generate_random_email():
    domains = ["example.com", "test.com", "demo.com", "mail.com"]
    return f"user{random.randint(1000, 9999)}@{random.choice(domains)}"

def generate_random_product():
    """Generate random product details and price."""
    products = [
        ('[Sample] Fog Linen Chambray Towel - Beige Stripe', 40.83),
        ('[Sample] Stainless Steel Water Bottle - 500ml', 25.50),
        ('[Sample] Organic Cotton T-shirt - Black', 19.99),
        ('[Sample] Wooden Desk Organizer', 34.99),
        ('[Sample] Leather Wallet', 59.99)
    ]
    product = random.choice(products)
    return f"Product ID: {random.randint(1000, 9999)}, Product Name: {product[0]}, Product SKU: SKU{random.randint(100000, 999999)}, Product Unit Price: {product[1]:.2f}, Product Total Price: {product[1]:.2f}"

def generate_random_order_status():
    """Generate random order status."""
    statuses = ["Pending", "Completed", "Shipped", "Cancelled", "Processing"]
    return random.choice(statuses)

def fetch_and_export_users_to_csv(db_session):
    try:
        users = db_session.query(FiveXFiveUser).limit(500).all()
        fieldnames = [
            'Order ID', 'Customer ID', 'Customer Name', 'Customer Email', 'Customer Phone',
            'Order Date', 'Order Status', 'Subtotal (inc tax)', 'Subtotal (ex tax)', 'Tax Total',
            'Shipping Cost (inc tax)', 'Shipping Cost (ex tax)', 'Ship Method', 'Handling Cost (inc tax)',
            'Handling Cost (ex tax)', 'Store Credit Redeemed', 'Gift Certificate Amount Redeemed',
            'Gift Certificate Code', 'Gift Certificate Expiration Date', 'Coupon Details', 
            'Order Total (inc tax)', 'Order Total (ex tax)', 'Payment Method', 'Total Quantity',
            'Total Shipped', 'Date Shipped', 'Order Currency Code', 'Exchange Rate', 'Order Notes', 
            'Customer Message', 'Billing First Name', 'Billing Last Name', 'Billing Company', 
            'Billing Street 1', 'Billing Street 2', 'Billing Suburb', 'Billing State', 'Billing Zip', 
            'Billing Country', 'Billing Phone', 'Billing Email', 'Shipping First Name', 
            'Shipping Last Name', 'Shipping Company', 'Shipping Street 1', 'Shipping Street 2', 
            'Shipping Suburb', 'Shipping State', 'Shipping Zip', 'Shipping Country', 'Shipping Phone',
            'Shipping Email', 'Product Details', 'Refund Amount', 'Channel ID', 'Channel Name', 'Fee Details'
        ]
        
        with open(CSV_FILE_PATH, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            
            for user in users:
                email_sources = [user.business_email, user.personal_emails, user.additional_personal_emails]

                row = {
                    'Order ID': random.randint(100, 999),
                    'Customer ID': user.id,
                    'Customer Name': f"{user.first_name} {user.last_name}",
                    'Customer Email':  random.choice([email for email in email_sources if email]) if any(email_sources) else generate_random_email(),
                    'Customer Phone': user.mobile_phone or user.personal_phone,
                    'Order Date': "24/12/2022",
                    'Order Status': generate_random_order_status(),
                    'Subtotal (inc tax)': random.uniform(20.00, 100.00),
                    'Subtotal (ex tax)': random.uniform(15.00, 80.00),
                    'Tax Total': random.uniform(2.00, 8.00),
                    'Shipping Cost (inc tax)': random.uniform(5.00, 15.00),
                    'Shipping Cost (ex tax)': random.uniform(4.00, 12.00),
                    'Ship Method': "Standard",
                    'Handling Cost (inc tax)': random.uniform(1.00, 5.00),
                    'Handling Cost (ex tax)': random.uniform(0.80, 4.00),
                    'Store Credit Redeemed': 0.00,
                    'Gift Certificate Amount Redeemed': 0.00,
                    'Gift Certificate Code': "",
                    'Gift Certificate Expiration Date': "",
                    'Coupon Details': "",
                    'Order Total (inc tax)': random.uniform(40.00, 150.00),
                    'Order Total (ex tax)': random.uniform(30.00, 120.00),
                    'Payment Method': "Manual",
                    'Total Quantity': random.randint(1, 5),
                    'Total Shipped': 0,
                    'Date Shipped': "",
                    'Order Currency Code': "USD",
                    'Exchange Rate': 1.0,
                    'Order Notes': "",
                    'Customer Message': "",
                    'Billing First Name': user.first_name,
                    'Billing Last Name': user.last_name,
                    'Billing Company': user.company_name,
                    'Billing Street 1': user.company_address,
                    'Billing Street 2': "",
                    'Billing Suburb': user.personal_city,
                    'Billing State': user.personal_state,
                    'Billing Zip': user.personal_zip,
                    'Billing Country': "United States",
                    'Billing Phone': user.mobile_phone,
                    'Billing Email': user.business_email,
                    'Shipping First Name': user.first_name,
                    'Shipping Last Name': user.last_name,
                    'Shipping Company': user.company_name,
                    'Shipping Street 1': user.company_address,
                    'Shipping Street 2': "",
                    'Shipping Suburb': user.personal_city,
                    'Shipping State': user.personal_state,
                    'Shipping Zip': user.personal_zip,
                    'Shipping Country': "United States",
                    'Shipping Phone': user.mobile_phone,
                    'Shipping Email': user.business_email,
                    'Product Details': generate_random_product(),
                    'Refund Amount': 0.00,
                    'Channel ID': random.randint(1, 10),
                    'Channel Name': "Gobbler",
                    'Fee Details': ""
                }
                writer.writerow(row)

        logger.info(f"CSV file created successfully: {CSV_FILE_PATH}")

    except Exception as e:
        logger.error(f"An error occurred: {e}")


def main():
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    Session = sessionmaker(bind=engine)

    db_session = Session()
    try:
        fetch_and_export_users_to_csv(db_session)
    finally:
        db_session.close()


if __name__ == "__main__":
    main()
