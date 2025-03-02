import sys
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.oauth2.credentials import Credentials
import base64
from google.auth.transport.requests import Request

def get_google_ads_client(client_id, client_secret, refresh_token, developer_token):
    credentials = Credentials(
        None,
        refresh_token=refresh_token,
        client_id=client_id,
        client_secret=client_secret,
        token_uri="https://oauth2.googleapis.com/token"
    )
    if credentials and credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())

    client = GoogleAdsClient(credentials=credentials, developer_token=developer_token)
    return client

def get_customer_info_and_resource_name(client):
    googleads_service = client.get_service("GoogleAdsService")
    customer_service = client.get_service("CustomerService")
    accessible_customers = customer_service.list_accessible_customers()
    resource_names = accessible_customers.resource_names
    
    customer_data = []

    for resource_name in resource_names:
        customer_id = resource_name.split('/')[-1]
        if customer_id != '9087286246':
            continue
        
        query = """
            SELECT
                customer.id,
                customer.descriptive_name
            FROM
                customer
        """
        response = googleads_service.search(customer_id=customer_id, query=query)
        for row in response:
            customer_id = row.customer.id
            customer_name = row.customer.descriptive_name
            customer_data.append({
                'customer_id': customer_id,
                'customer_name': customer_name,
            })
            print(get_user_lists(client, customer_id))
    
    print(f"Customer Data: {customer_data}")
    return customer_data

def get_user_lists(client, customer_id):
    # Получаем сервисы Google Ads
    googleads_service = client.get_service("GoogleAdsService")
    user_list_service = client.get_service("UserListService")
    
    # Формируем запрос для получения всех списков пользователей
    query = """
        SELECT
            user_list.id,
            user_list.name,
            user_list.description
        FROM
            user_list
    """

    # Выполнение запроса для получения списков пользователей
    response = googleads_service.search(customer_id=str(customer_id), query=query)
    
    user_lists = []
    
    for row in response:
        user_list = row.user_list
        user_lists.append({
            'user_list_id': user_list.id,
            'user_list_name': user_list.name
        })
    
    return user_lists

                    
if __name__ == "__main__":
    client_id = "1001249123388-16u7qafkkra58hcig94o28mpc1baeqf8.apps.googleusercontent.com"
    client_secret = "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"
    refresh_token = "1//01doaI9QO6hwJCgYIARAAGAESNwF-L9Irrmb-6LjnJ5RUO4YLOH33i5duOO5eZ2w_AFJ3XS71vr_8wR_Jqxu9CApgW2cdEvfPNL0"
    developer_token = "yhSD3B-oSsGyHZ3qVkdUBQ"

    googleads_client = get_google_ads_client(client_id, client_secret, refresh_token, developer_token)
    try:
        get_customer_info_and_resource_name(googleads_client)
    except GoogleAdsException as ex:
        print(
            f'Request with ID "{ex.request_id}" failed with status '
            f'"{ex.error.code().name}" and includes the following errors:'
        )
        for error in ex.failure.errors:
            print(f'\tError with message "{error.message}".')
            if error.location:
                for field_path_element in error.location.field_path_elements:
                    print(f"\t\tOn field: {field_path_element.field_name}")
        sys.exit(1)
