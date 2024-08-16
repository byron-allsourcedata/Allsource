from httpx import Client
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.engine import create_engine
import dotenv
from models.users_integrations import UserIntegration
from models.leads import Lead
from models.leads_users import LeadUser
import os
from utils import mapped_customers
import time
import logging
import traceback

def shopify_customers(client: Client, shop_domain: str, access_token: str):
    shopify_api_customers = '/admin/api/2024-07/customers.json'
    customers_url = f'https://{shop_domain}.myshopify.com{shopify_api_customers}'
    response = client.get(customers_url, headers={'X-Shopify-Access-Token': access_token})
    if response.status_code != 200:
        raise Exception
    customers = response.json().get('customers')
    return mapped_customers(customers)

def save_customer(session, customer, user_id: int):
    lead = session.query(Lead).filter(Lead.business_email == customer.business_email).first()
    if lead:
        session.query(LeadUser).filter(LeadUser.lead_id == lead.id).update({LeadUser.status: 'Existing'})
        session.commit()
        return
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
            creaditionals_service = session.query(UserIntegration).all()
            for creaditionals in creaditionals_service:
                if creaditionals.service_name == 'shopify':
                    customers = shopify_customers(client, creaditionals.shop_domain, creaditionals.access_token)
                    for customer in customers:
                        save_customer(session, customer, creaditionals.user_id)
            time.sleep(10)
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        traceback.print_exc()
    finally:
        client.close()
        session.close()



