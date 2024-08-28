import time
import logging
import traceback
import sys
import os
import dotenv
from httpx import Client
from woocommerce import API

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.engine import create_engine
from models.users_integrations import UserIntegration
from models.leads import Lead
from models.leads_users import LeadUser
from services.integrations.utils import mapped_customers


def shopify_customers(client: Client, shop_domain: str, access_token: str):
    shopify_api_customers = '/admin/api/2024-07/customers.json'
    customers_url = f'https://{shop_domain}.myshopify.com{shopify_api_customers}'
    response = client.get(customers_url, headers={'X-Shopify-Access-Token': access_token})
    if response.status_code != 200:
        raise Exception
    customers = response.json().get('customers')
    return mapped_customers('shopify',customers)


def woocommers_customers(url: str, consumer_key: str, consumer_secret: str):
    wcapi = API(url, consumer_key, consumer_secret, wp_api=True, version="wc/v3")
    customers = wcapi.get("customers").json()
    return mapped_customers('woocommerce', customers)


def bigcommerce_customers(client: Client, store_hash: str, auth_token: str):
    customers_url = f'https://api.bigcommerce.com/stores/{store_hash}/v3/customers'
    response = client.get(customers_url, headers={'X-Auth-Token': auth_token})
    if response.status_code != 200:
        raise Exception
    customers = response.json().get('data', [])
    return mapped_customers('bigcommerce', customers)


def klaviyo_customers(client: Client, access_token: str):
    custromers_url = f'https://a.klaviyo.com/api/profiles/'
    response = client.get(custromers_url, headers={'Authorization': f'Klaviyo-API-Key {access_token}', 'revision': '2023-12-15'})
    if response.status_code != 200:
        raise Exception
    customers = response.json().get('data', [])
    return mapped_customers('klaviyo', customers)


def save_customer(session, customer, user_id: int):
    existing_lead_user = session.query(LeadUser).join(Lead, Lead.id == LeadUser.lead_id).filter(
        Lead.business_email == customer.business_email,   
        LeadUser.user_id == user_id     
        ).first()
    if existing_lead_user:
        session.query(LeadUser).filter(LeadUser.id == existing_lead_user.id).update({LeadUser.status: 'Existing'})
    else:
        lead = Lead(**customer.__dict__)
        session.add(lead)
        session.commit()
        session.add(LeadUser(lead_id=lead.id, user_id=user_id, status='New', funnel='Converted'))
    session.commit()



if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    dotenv.load_dotenv()
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}")
    Session = sessionmaker(bind=engine)
    session = Session()
    client = Client()
    try:
        while True:
            credentials_service = session.query(UserIntegration).all()
            for credentials in credentials_service:
                if credentials.service_name == 'shopify':
                    customers = shopify_customers(client, credentials.shop_domain, credentials.access_token)
                elif credentials.service_name == 'bigcommerce':
                    customers = bigcommerce_customers(client, credentials.shop_domain, credentials.access_token)
                elif credentials.service_name == 'woocommerce':
                    customers = woocommers_customers(credentials.shop_domain, credentials.consumer_key, credentials.consumer_secret)
                elif credentials.service_name == 'klaviyo':
                    customers = klaviyo_customers(client, credentials.access_token)
                for customer in customers:
                    save_customer(session, customer, credentials.user_id)
            time.sleep(10*60)        
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        traceback.print_exc()
    finally:
        client.close()
        session.close()



