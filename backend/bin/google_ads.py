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

def main(client):
    customer_service = client.get_service("CustomerService")
    accessible_customers = customer_service.list_accessible_customers()
    
    result_total = len(accessible_customers.resource_names)
    print(f"Total results: {result_total}")

    resource_names = accessible_customers.resource_names
    for resource_name in resource_names:
        print(f'Customer resource name: "{resource_name}"')
                    
if __name__ == "__main__":
    client_id = "1001249123388-16u7qafkkra58hcig94o28mpc1baeqf8.apps.googleusercontent.com"
    client_secret = "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"
    refresh_token = "1//01uIYj604S14DCgYIARAAGAESNwF-L9IrsOvgM8N4h0xUdQad4Eo3fuHi5yPMaxFtXyqGBXnsmoazHUvTx7oHTVxIqHnzkJxWJx0"
    developer_token = "yhSD3B-oSsGyHZ3qVkdUBQ"

    googleads_client = get_google_ads_client(client_id, client_secret, refresh_token, developer_token)

    try:
        main(googleads_client)
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
