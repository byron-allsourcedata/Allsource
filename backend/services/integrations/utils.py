from schemas.integrations import Customer

def extract_shopify_data(customer):
    addresses = customer.get('addresses', [])
    address = addresses[0] if addresses else {}
    
    return Customer(
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
    
    return Customer(
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
    
    return Customer(
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

def mapped_customers(service_name, customers):
    if service_name == 'shopify':
        return [extract_shopify_data(customer) for customer in customers]
    elif service_name == 'woocommerce':
        return [extract_woocommerce_data(customer) for customer in customers]
    elif service_name == 'bigcommerce':
        return [extract_bigcommerce_data(customer) for customer in customers.get("data", [])]
    else:
        raise ValueError(f"Unsupported service name: {service_name}")
