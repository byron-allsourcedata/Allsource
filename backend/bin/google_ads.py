import sys
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.oauth2.credentials import Credentials
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
        
def create_base_user_list(client, customer_id, user_list_name):
    """Creates a user list targeting users that have visited a given URL.

    Args:
        client: an initialized GoogleAdsClient instance.
        customer_id: a str client customer ID used to create a user list.

    Returns:
        a str resource name for the newly created user list.
    """
    # Creates a UserListOperation.
    user_list_operation = client.get_type("UserListOperation")
    # Creates a UserList.
    user_list = user_list_operation.create
    user_list.name = f"{user_list_name}"
    user_list.description = "Any visitor to any page of example.com"
    user_list.membership_status = client.enums.UserListMembershipStatusEnum.OPEN
    user_list.membership_life_span = 365
    # Optional: To include past users in the user list, set the
    # prepopulation_status to REQUESTED.
    user_list.rule_based_user_list.prepopulation_status = (
        client.enums.UserListPrepopulationStatusEnum.REQUESTED
    )
    # Specifies that the user list targets visitors of a page with a URL that
    # contains 'example.com'.
    user_list_rule_item_group_info = client.get_type(
        "UserListRuleItemGroupInfo"
    )
    user_list_rule_item_info = client.get_type("UserListRuleItemInfo")
    # Uses a built-in parameter to create a domain URL rule.
    user_list_rule_item_info.name = "url__"
    user_list_rule_item_info.string_rule_item.operator = (
        client.enums.UserListStringRuleItemOperatorEnum.CONTAINS
    )
    user_list_rule_item_info.string_rule_item.value = "example.com"
    user_list_rule_item_group_info.rule_items.append(user_list_rule_item_info)

    # Specify that the user list targets visitors of a page based on the
    # provided rule.
    flexible_rule_user_list_info = (
        user_list.rule_based_user_list.flexible_rule_user_list
    )
    flexible_rule_user_list_info.inclusive_rule_operator = (
        client.enums.UserListFlexibleRuleOperatorEnum.AND
    )
    # Inclusive operands are joined together with the specified
    # inclusive rule operator.
    rule_operand = client.get_type("FlexibleRuleOperandInfo")
    rule_operand.rule.rule_item_groups.extend([user_list_rule_item_group_info])
    rule_operand.lookback_window_days = 7
    flexible_rule_user_list_info.inclusive_operands.append(rule_operand)

    user_list_service = client.get_service("UserListService")
    response = user_list_service.mutate_user_lists(
        customer_id=customer_id, operations=[user_list_operation]
    )
    resource_name = response.results[0].resource_name
    print(f"Created user list with resource name: '{resource_name}'")
    return resource_name
            
if __name__ == "__main__":
    client_id = "1001249123388-16u7qafkkra58hcig94o28mpc1baeqf8.apps.googleusercontent.com"
    client_secret = "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"
    refresh_token = "1//01uIYj604S14DCgYIARAAGAESNwF-L9IrsOvgM8N4h0xUdQad4Eo3fuHi5yPMaxFtXyqGBXnsmoazHUvTx7oHTVxIqHnzkJxWJx0"
    developer_token = "yhSD3B-oSsGyHZ3qVkdUBQ"

    googleads_client = get_google_ads_client(client_id, client_secret, refresh_token, developer_token)

    try:
        #main(googleads_client)
        create_base_user_list(googleads_client, '9087286246', 'Frequent Shoppers2')
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
