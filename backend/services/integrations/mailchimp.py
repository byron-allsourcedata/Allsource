from fastapi import HTTPException
from schemas.integrations.mailchimp import MailchimpCustomer
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from datetime import datetime
import mailchimp_marketing as MailchimpMarketing
from mailchimp_marketing.api_client import ApiClientError
from schemas.integrations.integrations import IntegrationCredentials

class MailchimpIntegrationsService:


    def __init__(self, integration_persistence: IntegrationsPresistence):
        self.integration_persistence = integration_persistence


    def __get_customers(self, data_center: str, api_key: str):
        customers = list()
        try:
            client = MailchimpMarketing.Client()
            client.set_config({'api_key': api_key, 'server': data_center})
            lists = client.lists.get_all_lists()
            for item in lists.get('lists'):
                customer = client.lists.get_list_members_info(item['id'])
                for member in customer['members']:
                    customers.append(member)
            return customers
        except ApiClientError as error:
            raise HTTPException(status_code=400, detail=error.text)


    def __save_integration(self, data_center: str, api_key: str,  user_id:int):
        credentails = {'user_id': user_id, 'shop_domain': data_center,
                       'access_token': api_key, 'service_name': 'Shopify'}
        integrations = self.integration_persistence.create_integration(credentails)
        if not integrations:
            raise HTTPException(status_code=409)
        return integrations

    def __save_customer(self, customer: MailchimpCustomer, user_id):
        with self.integration_persistence as service:
            return service.mailchimp.save_customer(customer.model_dump(), user_id)


    def add_integrations(self, credentials: IntegrationCredentials, user):
        customers = [self.__mapped_customer(customer) for customer in self.__get_customers(credentials.mailchimp.data_center, credentials.mailchimp.access_token)]
        integrataion = self.__save_integration(credentials.mailchimp.data_center, credentials.mailchimp.access_token, user['id'])
        for customer in customers:
            self.__save_customer(customer, user['id'])
        return {
            'status': 'Successfuly',
            'detail': {
                'id': integrataion.id,
                'serivce_name': 'Mailchimp'
            }
        }


    def __mapped_customer(self, customer) -> MailchimpCustomer:
        marketing_permissions = customer.get("marketing_permissions", [])
        marketing_permission = marketing_permissions[0] if marketing_permissions else {}

        timestamp_signup = customer.get("timestamp_signup")
        timestamp_opt = customer.get("timestamp_opt")
        last_changed = customer.get("last_changed")
        
        try:
            timestamp_signup = datetime.fromisoformat(timestamp_signup.replace('Z', '+00:00'))
        except (TypeError, ValueError):
            timestamp_signup = None
        
        try:
            timestamp_opt = datetime.fromisoformat(timestamp_opt.replace('Z', '+00:00'))
        except (TypeError, ValueError):
            timestamp_opt = None
        
        try:
            last_changed = datetime.fromisoformat(last_changed.replace('Z', '+00:00'))
        except (TypeError, ValueError):
            last_changed = None

        return MailchimpCustomer(
            mailchimp_user_id=customer.get("id"),
            email=customer.get("email_address"),
            unique_email_id=customer.get("unique_email_id"),
            contact_id=customer.get("contact_id"),
            full_name=customer.get("full_name"),
            web_id=customer.get("web_id"),
            email_type=customer.get("email_type"),
            status=customer.get("status"),
            unsubscribe_reason=customer.get("unsubscribe_reason"),
            consents_to_one_to_one_messaging=customer.get("consents_to_one_to_one_messaging"),
            merge_fields_property1=customer.get("merge_fields", {}).get("property1"),
            merge_fields_property2=customer.get("merge_fields", {}).get("property2"),
            interests_property1=customer.get("interests", {}).get("property1"),
            interests_property2=customer.get("interests", {}).get("property2"),
            stats_avg_open_rate=customer.get("stats", {}).get("avg_open_rate"),
            stats_avg_click_rate=customer.get("stats", {}).get("avg_click_rate"),
            ecommerce_total_revenue=customer.get("stats", {}).get("ecommerce_data", {}).get("total_revenue"),
            ecommerce_number_of_orders=customer.get("stats", {}).get("ecommerce_data", {}).get("number_of_orders"),
            ecommerce_currency_code=customer.get("stats", {}).get("ecommerce_data", {}).get("currency_code"),
            ip_signup=customer.get("ip_signup"),
            timestamp_signup=timestamp_signup,
            ip_opt=customer.get("ip_opt"),
            timestamp_opt=timestamp_opt,
            member_rating=customer.get("member_rating"),
            last_changed=last_changed,
            language=customer.get("language"),
            vip=customer.get("vip"),
            email_client=customer.get("email_client"),
            location_latitude=customer.get("location", {}).get("latitude"),
            location_longitude=customer.get("location", {}).get("longitude"),
            location_gmtoff=customer.get("location", {}).get("gmtoff"),
            location_dstoff=customer.get("location", {}).get("dstoff"),
            location_country_code=customer.get("location", {}).get("country_code"),
            location_timezone=customer.get("location", {}).get("timezone"),
            location_region=customer.get("location", {}).get("region"),
            marketing_permission_id=marketing_permission.get("marketing_permission_id"),
            marketing_permission_text=marketing_permission.get("text"),
            marketing_permission_enabled=marketing_permission.get("enabled"),
        )