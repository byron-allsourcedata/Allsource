from schemas.integrations.integrations import Lead
from abc import ABC, abstractmethod


class IntegrationsABC(ABC):

    @abstractmethod
    def __init__(self) -> None:
        raise NotImplementedError

    @abstractmethod
    def get_customers(self):
        raise NotImplementedError
    
    @abstractmethod
    def create_integration(self):
        raise NotImplementedError



def extract_shopify_data(customer):
    addresses = customer.get('addresses', [])
    address = addresses[0] if addresses else {}
    
    return Lead(
        first_name=customer.get("first_name"),
        last_name=customer.get("last_name"),
        mobile_phone=customer.get("phone"),
        company_address=f"{address.get('address1', '')} {address.get('address2', '')}",
        company_city=address.get("city"),
        company_state=address.get("province"),
        company_zip=address.get("zip"),
        business_email=customer.get("email"),
        time_spent=float(customer.get("total_spent", 0)),
        no_of_visits=customer.get("orders_count"),
        no_of_page_visits=customer.get("orders_count"),
        company_name=address.get("company"),
        company_phone=address.get("phone"),
        company_revenue=float(customer.get("total_spent", 0)),
        company_employee_count=None
    )

def extract_woocommerce_data(customer):
    billing = customer.get("billing", {})
    
    return Lead(
        first_name=customer.get("first_name"),
        last_name=customer.get("last_name"),
        mobile_phone=billing.get("phone"),
        company_address=f"{billing.get('address_1', '')} {billing.get('address_2', '')}",
        company_city=billing.get("city"),
        company_state=billing.get("state"),
        company_zip=billing.get("postcode"),
        business_email=customer.get("email"),
        time_spent=None,
        no_of_visits=None,
        no_of_page_visits=None,
        company_name=billing.get("company"),
        company_phone=billing.get("phone"),
        company_revenue=None,
        company_employee_count=None
    )

def extract_bigcommerce_data(customer):
    addresses = customer.get('addresses', [])
    address = addresses[0] if addresses else {}
    
    return Lead(
        first_name=customer.get("first_name"),
        last_name=customer.get("last_name"),
        mobile_phone=customer.get("phone"),
        company_address=f"{address.get('address1', '')} {address.get('address2', '')}",
        company_city=address.get("city"),
        company_state=address.get("state_or_province"),
        company_zip=address.get("postal_code"),
        business_email=customer.get("email"),
        time_spent=None,
        no_of_visits=None,
        no_of_page_visits=None,
        company_name=customer.get("company"),
        company_phone=customer.get("phone"),
        company_revenue=None,
        company_employee_count=None
    )


def extract_klaviyo_data(customer) -> Lead:
    attributes = customer.get("attributes", {})
    
    return Lead(
        first_name=attributes.get("first_name"),
        last_name=attributes.get("last_name"),
        mobile_phone=attributes.get("phone_number"),
        company_address=f"{attributes.get('location', {}).get('address1', '')} {attributes.get('location', {}).get('address2', '')}".strip(),
        company_city=attributes.get("location", {}).get("city"),
        company_state=attributes.get("location", {}).get("region"),
        company_zip=attributes.get("location", {}).get("zip"),
        business_email=attributes.get("email"),
        time_spent=None,
        no_of_visits=None,
        no_of_page_visits=None,
        company_name=attributes.get("organization"),
        company_phone=attributes.get("phone_number"),
        company_revenue=None,
        company_employee_count=None
    )


def extract_mailchimp_data(customer):
    address = customer.get('address', {})
    
    return Lead(
        first_name=customer.get("first_name"),
        last_name=customer.get("last_name"),
        mobile_phone=None, 
        company_address=f"{address.get('address1', '')} {address.get('address2', '')}".strip(),
        company_city=address.get("city"),
        company_state=address.get("province"),
        company_zip=address.get("postal_code"),
        business_email=customer.get("email_address"),
        time_spent=float(customer.get("total_spent", 0)),
        no_of_visits=customer.get("orders_count"),
        no_of_page_visits=customer.get("orders_count"),
        company_name=customer.get("company"),
        company_phone=None,
        company_revenue=float(customer.get("total_spent", 0)),
        company_employee_count=None)


def mapped_customers(service_name, customers):
    if service_name == 'shopify':
        return [extract_shopify_data(customer) for customer in customers]
    elif service_name == 'woocommerce':
        return [extract_woocommerce_data(customer) for customer in customers]
    elif service_name == 'bigcommerce':
        return [extract_bigcommerce_data(customer) for customer in customers]
    elif service_name == 'klaviyo':
        return [extract_klaviyo_data(customer) for customer in customers]
    elif service_name == 'mailchimp':
        return [extract_mailchimp_data(customer) for customer in customers]
    else:
        raise ValueError(f"Unsupported service name: {service_name}")
