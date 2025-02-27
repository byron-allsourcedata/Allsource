import argparse
import hashlib
import sys
import uuid
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException


def main(
    client,
    customer_id,
    run_job,
    user_list_id,
    offline_user_data_job_id,
    ad_user_data_consent,
    ad_personalization_consent,
):
    googleads_service = client.get_service("GoogleAdsService")

    if not offline_user_data_job_id:
        if user_list_id:
            user_list_resource_name = googleads_service.user_list_path(
                customer_id, user_list_id
            )
        else:
            user_list_resource_name = create_customer_match_user_list(
                client, customer_id
            )

    add_users_to_customer_match_user_list(
        client,
        customer_id,
        user_list_resource_name,
        run_job,
        offline_user_data_job_id,
        ad_user_data_consent,
        ad_personalization_consent,
    )

def create_customer_match_user_list(client, customer_id):
    user_list_service_client = client.get_service("UserListService")
    user_list_operation = client.get_type("UserListOperation")
    user_list = user_list_operation.create
    user_list.name = f"Customer Match list #{uuid.uuid4()}"
    user_list.description = (
        "A list of customers that originated from email and physical addresses"
    )
    user_list.crm_based_user_list.upload_key_type = (
        client.enums.CustomerMatchUploadKeyTypeEnum.CONTACT_INFO
    )
    user_list.membership_life_span = 300
    
    response = user_list_service_client.mutate_user_lists(
        customer_id=customer_id, operations=[user_list_operation]
    )
    user_list_resource_name = response.results[0].resource_name
    print(
        f"User list with resource name '{user_list_resource_name}' was created."
    )

    return user_list_resource_name

def add_users_to_customer_match_user_list(
    client,
    customer_id,
    user_list_resource_name,
    run_job,
    offline_user_data_job_id,
    ad_user_data_consent,
    ad_personalization_consent,
):
    offline_user_data_job_service_client = client.get_service(
        "OfflineUserDataJobService"
    )

    if offline_user_data_job_id:
        offline_user_data_job_resource_name = (
            offline_user_data_job_service_client.offline_user_data_job_path(
                customer_id, offline_user_data_job_id
            )
        )
    else:
        offline_user_data_job = client.get_type("OfflineUserDataJob")
        offline_user_data_job.type_ = (
            client.enums.OfflineUserDataJobTypeEnum.CUSTOMER_MATCH_USER_LIST
        )
        offline_user_data_job.customer_match_user_list_metadata.user_list = (
            user_list_resource_name
        )

        if ad_user_data_consent:
            offline_user_data_job.customer_match_user_list_metadata.consent.ad_user_data = client.enums.ConsentStatusEnum[
                ad_user_data_consent
            ]
        if ad_personalization_consent:
            offline_user_data_job.customer_match_user_list_metadata.consent.ad_personalization = client.enums.ConsentStatusEnum[
                ad_personalization_consent
            ]

        create_offline_user_data_job_response = (
            offline_user_data_job_service_client.create_offline_user_data_job(
                customer_id=customer_id, job=offline_user_data_job
            )
        )
        offline_user_data_job_resource_name = (
            create_offline_user_data_job_response.resource_name
        )
        print(
            "Created an offline user data job with resource name: "
            f"'{offline_user_data_job_resource_name}'."
        )
        
    request = client.get_type("AddOfflineUserDataJobOperationsRequest")
    request.resource_name = offline_user_data_job_resource_name
    request.operations.extend(build_offline_user_data_job_operations(client))
    request.enable_partial_failure = True

    response = offline_user_data_job_service_client.add_offline_user_data_job_operations(
        request=request
    )

    partial_failure = getattr(response, "partial_failure_error", None)
    if getattr(partial_failure, "code", None) != 0:
        error_details = getattr(partial_failure, "details", [])
        for error_detail in error_details:
            failure_message = client.get_type("GoogleAdsFailure")
            failure_object = type(failure_message).deserialize(
                error_detail.value
            )

            for error in failure_object.errors:
                print(
                    "A partial failure at index "
                    f"{error.location.field_path_elements[0].index} occurred.\n"
                    f"Error message: {error.message}\n"
                    f"Error code: {error.error_code}"
                )

    print("The operations are added to the offline user data job.")

    if not run_job:
        print(
            "Not running offline user data job "
            f"'{offline_user_data_job_resource_name}', as requested."
        )
        return

    # Issues a request to run the offline user data job for executing all
    # added operations.
    offline_user_data_job_service_client.run_offline_user_data_job(
        resource_name=offline_user_data_job_resource_name
    )


# [START add_customer_match_user_list_2]
def build_offline_user_data_job_operations(client):
    raw_record_1 = {
        "email": "dana@example.com",
        "phone": "+1 800 5550101",
    }
    raw_record_2 = {
        "email": "alex.2@example.com",
        "first_name": "Alex",
        "last_name": "Quinn",
        "country_code": "US",
        "postal_code": "94045",
        "phone": "+1 800 5550102",
    }
    raw_record_3 = {"email": "charlie@example.com"}

    raw_records = [raw_record_1, raw_record_2, raw_record_3]

    operations = []
    for record in raw_records:
        user_data = client.get_type("UserData")
        if "email" in record:
            user_identifier = client.get_type("UserIdentifier")
            user_identifier.hashed_email = normalize_and_hash(
                record["email"], True
            )
            user_data.user_identifiers.append(user_identifier)
            
        if "phone" in record:
            user_identifier = client.get_type("UserIdentifier")
            user_identifier.hashed_phone_number = normalize_and_hash(
                record["phone"], True
            )
            user_data.user_identifiers.append(user_identifier)
            
        if "first_name" in record:
            required_keys = ("last_name", "country_code", "postal_code")
            if not all(key in record for key in required_keys):
                missing_keys = record.keys() - required_keys
                print(
                    "Skipping addition of mailing address information "
                    "because the following required keys are missing: "
                    f"{missing_keys}"
                )
            else:
                user_identifier = client.get_type("UserIdentifier")
                address_info = user_identifier.address_info
                address_info.hashed_first_name = normalize_and_hash(
                    record["first_name"], False
                )
                address_info.hashed_last_name = normalize_and_hash(
                    record["last_name"], False
                )
                address_info.country_code = record["country_code"]
                address_info.postal_code = record["postal_code"]
                user_data.user_identifiers.append(user_identifier)

        if user_data.user_identifiers:
            operation = client.get_type("OfflineUserDataJobOperation")
            operation.create.CopyFrom(user_data)
            operations.append(operation)
        
    return operations

def normalize_and_hash(s, remove_all_whitespace):
    if remove_all_whitespace:
        s = "".join(s.split())
    else:
        s = s.strip().lower()

    return hashlib.sha256(s.encode()).hexdigest()

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

if __name__ == "__main__":

    try:
        client_id = "1001249123388-16u7qafkkra58hcig94o28mpc1baeqf8.apps.googleusercontent.com"
        client_secret = "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"
        refresh_token = "1//01uIYj604S14DCgYIARAAGAESNwF-L9IrsOvgM8N4h0xUdQad4Eo3fuHi5yPMaxFtXyqGBXnsmoazHUvTx7oHTVxIqHnzkJxWJx0"
        developer_token = "yhSD3B-oSsGyHZ3qVkdUBQ"
        googleads_client = get_google_ads_client(client_id, client_secret, refresh_token, developer_token)
        customer_id = '9087286246'
        run_job = True
        user_list_id = None
        offline_user_data_job_id = None
        ad_user_data_consent = None
        ad_personalization_consent = None
        main(
            googleads_client,
            customer_id,
            run_job,
            user_list_id,
            offline_user_data_job_id,
            ad_user_data_consent,
            ad_personalization_consent,
        )
    except GoogleAdsException as ex:
        print(
            f"Request with ID '{ex.request_id}' failed with status "
            f"'{ex.error.code().name}' and includes the following errors:"
        )
        for error in ex.failure.errors:
            print(f"\tError with message '{error.message}'.")
            if error.location:
                for field_path_element in error.location.field_path_elements:
                    print(f"\t\tOn field: {field_path_element.field_name}")
        sys.exit(1)