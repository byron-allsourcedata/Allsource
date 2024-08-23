from fastapi import HTTPException
from schemas.integrations.mailchimp import MailchimpUserScheme
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from typing import List, Any
from datetime import datetime
import logging
from .utils import IntegrationsABC
import mailchimp_marketing as MailchimpMarketing
from mailchimp_marketing.api_client import ApiClientError


class MailchimpIntegrations(IntegrationsABC):

    def __init__(self, integration_persistence: IntegrationsPresistence, user):
        self.integration_persistence = integration_persistence
        self.user = user


    def __mapped_leads(self, leads: List[Any]) -> List[MailchimpUserScheme]:
        mailchimp_users = []
        for member in leads:
            marketing_permissions = member.get("marketing_permissions", [])
            marketing_permission = marketing_permissions[0] if marketing_permissions else {}

            timestamp_signup = member.get("timestamp_signup")
            timestamp_opt = member.get("timestamp_opt")
            last_changed = member.get("last_changed")
            
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

            mailchimp_users.append(MailchimpUserScheme(
                mailchimp_user_id=member.get("id"),
                email=member.get("email_address"),
                unique_email_id=member.get("unique_email_id"),
                contact_id=member.get("contact_id"),
                full_name=member.get("full_name"),
                web_id=member.get("web_id"),
                email_type=member.get("email_type"),
                status=member.get("status"),
                unsubscribe_reason=member.get("unsubscribe_reason"),
                consents_to_one_to_one_messaging=member.get("consents_to_one_to_one_messaging"),
                merge_fields_property1=member.get("merge_fields", {}).get("property1"),
                merge_fields_property2=member.get("merge_fields", {}).get("property2"),
                interests_property1=member.get("interests", {}).get("property1"),
                interests_property2=member.get("interests", {}).get("property2"),
                stats_avg_open_rate=member.get("stats", {}).get("avg_open_rate"),
                stats_avg_click_rate=member.get("stats", {}).get("avg_click_rate"),
                ecommerce_total_revenue=member.get("stats", {}).get("ecommerce_data", {}).get("total_revenue"),
                ecommerce_number_of_orders=member.get("stats", {}).get("ecommerce_data", {}).get("number_of_orders"),
                ecommerce_currency_code=member.get("stats", {}).get("ecommerce_data", {}).get("currency_code"),
                ip_signup=member.get("ip_signup"),
                timestamp_signup=timestamp_signup,
                ip_opt=member.get("ip_opt"),
                timestamp_opt=timestamp_opt,
                member_rating=member.get("member_rating"),
                last_changed=last_changed,
                language=member.get("language"),
                vip=member.get("vip"),
                email_client=member.get("email_client"),
                location_latitude=member.get("location", {}).get("latitude"),
                location_longitude=member.get("location", {}).get("longitude"),
                location_gmtoff=member.get("location", {}).get("gmtoff"),
                location_dstoff=member.get("location", {}).get("dstoff"),
                location_country_code=member.get("location", {}).get("country_code"),
                location_timezone=member.get("location", {}).get("timezone"),
                location_region=member.get("location", {}).get("region"),
                marketing_permission_id=marketing_permission.get("marketing_permission_id"),
                marketing_permission_text=marketing_permission.get("text"),
                marketing_permission_enabled=marketing_permission.get("enabled"),
            ))
        return mailchimp_users


    def get_leads(self, api_key: str, data_center: str):
        logging.info(f'Get leads from Mailchimp <- email: {self.user['email']}, api_key: {api_key}, date_center: {data_center}')
        leads = list()
        try:
            client = MailchimpMarketing.Client()
            client.set_config({'api_key': api_key, 'server': data_center})
            lists = client.lists.get_all_lists()
            for item in lists.get('lists'):
                lead = client.lists.get_list_members_info(item['id'])
                for member in lead['members']:
                    leads.append(member)
            return leads
        except ApiClientError as error:
            raise HTTPException(status_code=400, detail=error.text)
    
    def __save_integrations(self, access_token: str, data_center: str):
        credentials = {'user_id': self.user['id'], 'shop_domain': data_center, 'access_token': access_token, 'service_name': 'mailchimp' }
        integration = self.integration_persistence.get_user_integrations_by_service(self.user['id'], 'mailchimp')
        if not integration:
            logging.info(f'{self.user['email']} create integration Mailchimp')
            integration = self.integration_persistence.create_integration(credentials)
            return integration
        logging.info(f'{self.user['email']} update integration Mailchimp')
        self.integration_persistence.edit_integrations(integration.id, credentials)
        return 
    
    def __save_leads(self, leads: List[MailchimpUserScheme]):
        for lead in leads:
            with self.integration_persistence as persistence:
                persistence.mailchimp.save_leads(lead.model_dump(), self.user['id'])

    def create_integration(self, access_token: str, data_center: str):
        leads = self.get_leads(access_token, data_center)
        self.__save_integrations(access_token, data_center)
        self.__save_leads(self.__mapped_leads(leads))
        return 