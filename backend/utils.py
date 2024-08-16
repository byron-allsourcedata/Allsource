from datetime import datetime, timedelta, timezone
from schemas.integrations import Customer
def get_utc_aware_date():
    return datetime.now(timezone.utc).replace(microsecond=0)

def get_utc_aware_date_for_postgres():
    return get_utc_aware_date().isoformat()[:-6] + "Z"

def mapped_customers(customers):
    return [Customer(
            first_name=customer.get("first_name"),
            last_name=customer.get("last_name"),
            mobile_phone=customer.get("phone"),
            company_address=f"{customer['addresses'][0]['address1'] } {customer['addresses'][0]['address2']}" if customer['addresses'] else None,
            company_city=customer['addresses'][0]['city'] if customer['addresses'] else None,
            company_state=customer['addresses'][0]['province'] if customer['addresses'] else None,
            company_zip=customer['addresses'][0]['zip'] if customer['addresses'] else None,
            business_email=customer.get("email"),
            time_spent=float(customer.get("total_spent")),
            no_of_visits=customer.get("orders_count"),
            no_of_page_visits=customer.get("orders_count"),
            company_name=customer['addresses'][0].get("company") if customer['addresses'] else None,
            company_phone=customer['addresses'][0].get("phone") if customer['addresses'] else None,
            company_revenue=float(customer.get("total_spent")),
            company_employee_count=None) 
            for customer in customers]