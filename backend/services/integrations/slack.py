import logging
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from config.slack import SlackConfig
from fastapi import HTTPException
import json
from typing import List
from urllib.parse import unquote
import base64
import os
from datetime import datetime, timedelta
from utils import extract_first_email
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from schemas.integrations.integrations import DataMap
from slack_sdk.oauth import AuthorizeUrlGenerator
from models.five_x_five_users import FiveXFiveUser
from persistence.user_persistence import UserPersistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from enums import SourcePlatformEnum, IntegrationsStatus, ProccessDataSyncResult
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.leads_persistence import LeadsPersistence

logger = logging.getLogger("slack")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)


class SlackService:
    def __init__(self, user_persistence: UserPersistence, user_integrations_persistence: IntegrationsPresistence,
                 sync_persistence: IntegrationsUserSyncPersistence, million_verifier_integrations: MillionVerifierIntegrationsService,
                 lead_persistence: LeadsPersistence):
        self.user_persistence = user_persistence
        self.integrations_persistence = user_integrations_persistence
        self.sync_persistence = sync_persistence
        self.lead_persistence = lead_persistence
        self.million_verifier_integrations = million_verifier_integrations

    def get_credential(self, domain_id, user_id):
        return self.integrations_persistence.get_credentials_for_service(domain_id=domain_id, user_id=user_id, service_name=SourcePlatformEnum.SLACK.value)
    
    
    def edit_sync(self, leads_type: str, integrations_users_sync_id: int, domain_id: int, created_by: str, user_id: int, data_map: List[DataMap] = []):
        credentials = self.get_credential(domain_id, user_id)
        sync = self.sync_persistence.edit_sync({
            'integration_id': credentials.id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        }, integrations_users_sync_id)
        return sync
    
    def update_credential(self, domain_id, access_token):
        return self.integrations_persistence.update_credential_for_service(domain_id, SourcePlatformEnum.SLACK.value, access_token)

    def save_integration(self, domain_id: int, access_token: str, user: dict, team_id):
        credential = self.get_credential(domain_id, user.get('id'))
        if credential:
            return self.update_credential(domain_id, access_token)
        
        common_integration = os.getenv('COMMON_INTEGRATION') == 'True'
        integration_data = {
            'access_token': access_token,
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.SLACK.value,
            'slack_team_id': team_id
        }

        if common_integration:
            integration_data['user_id'] = user.get('id')
        else:
            integration_data['domain_id'] = domain_id
            
        integartion = self.integrations_persistence.create_integration(integration_data)
        
        if not integartion:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        
        return integartion

    def generate_authorize_url(self, user_id, domain_id):
        state_payload = json.dumps({"user_id": user_id, "domain_id": domain_id})
        state = base64.urlsafe_b64encode(state_payload.encode()).decode()

        generator = AuthorizeUrlGenerator(
            client_id=SlackConfig.client_id,
            scopes=[
                "channels:join",
                "channels:manage",
                "channels:read",
                "chat:write"
            ],
            user_scopes=[],
            redirect_uri=SlackConfig.redirect_url,
        )
        return generator.generate(state=state)

    def decode_state(self, state: str):
        try:
            decoded_bytes = base64.urlsafe_b64decode(state)
            decoded_str = decoded_bytes.decode('utf-8')
            state_data = json.loads(decoded_str)
            return state_data
        except Exception as e:
            raise ValueError(f"Failed to decode state: {e}")

    def slack_oauth_callback(self, code: str, state):
        if not state:
            return {'status': 'Maximiz user not found'}
        state = self.decode_state(state)
        user_id = state.get('user_id')
        domain_id = state.get('domain_id')
        client = WebClient()
        response = client.oauth_v2_access(
            client_id=SlackConfig.client_id,
            client_secret=SlackConfig.client_secret,
            code=code,
            redirect_uri=SlackConfig.redirect_url
        )
        if response['ok']:
            slack_bot_token = response['access_token']
            team_id = response['team']['id']
            user = self.user_persistence.get_user_by_id(user_id)
            if user:
                self.save_integration(domain_id, slack_bot_token, user, team_id)
                return {'status': 'SUCCESS', 'user_id': user_id}
            else:
                return {'status': "Maximiz user not found"}
        else:
            return {'status': "OAuth failed"}
     
    def update_app_home_opened(self, team_id):
        self.integrations_persistence.update_app_home_opened(slack_team_id=team_id)
        return True
    
    def handle_app_home_opened(self, user_id, team_id):
        user_integration = self.integrations_persistence.get_credential(slack_team_id=team_id)
        if user_integration.is_slack_first_message_sent:
            return
        
        bot_token = user_integration.access_token
        if not bot_token:
            logger.error(f"Error: Bot token: {bot_token} not found")
            return
            
        client = WebClient(token=bot_token)
        try:
            client.chat_postMessage(
                channel=user_id,
                text="Welcome to App Home! I'll share updates via Contacts using the Maximiz app."
            )
            self.update_app_home_opened(team_id)
        except SlackApiError as e:
            logger.error(f"Error sending message: {e.response['error']}")

    def handle_app_uninstalled(self, team_id):
        self.integrations_persistence.delete_integration_by_slack_team_id(team_id=team_id)
        logger.debug("App was uninstalled. Performing cleanup...")
    
    def slack_events(self, data):
        team_id = data.get("team_id")
        event = data.get("event", {})
        event_type = event.get("type")
        user_id = event.get("user")

        if event_type == "app_home_opened":
            self.handle_app_home_opened(user_id=user_id, team_id=team_id)

        elif event_type == "app_uninstalled":
            self.handle_app_uninstalled(team_id=team_id)

    def create_channel(self, domain_id, user_id, channel_name):
        user_integration = self.get_credential(domain_id, user_id)
        client = WebClient(token=user_integration.access_token)
        try:
            response = client.conversations_create(
                name=channel_name,
                is_private=False
            )
            if response["ok"]:
                return {
                    "status": IntegrationsStatus.SUCCESS.value,
                    "channel": response["channel"]
                }
        except SlackApiError as e:
            error_message = e.response.get("error", "unknown_error")
            return {
                "status": IntegrationsStatus.CREATE_IS_FAILED.value,
                "message": error_message
            }

    def join_channel(self, client_token, channel_id):
        client = WebClient(token=client_token)
        try:
            response = client.conversations_join(channel=channel_id)
            if response["ok"]:
                return {'status': IntegrationsStatus.SUCCESS.value}
            else:
                return {'status': IntegrationsStatus.JOIN_CHANNEL_IS_FAILED.value,
                        'message': response['error']
                        }
        except SlackApiError as e:
            return {'status': IntegrationsStatus.JOIN_CHANNEL_IS_FAILED.value,
                    'message': e.response['error']
                    }

    def get_first_visited_url(self, lead_user):
        return self.lead_persistence.get_first_visited_url(lead_user)

    async def process_data_sync(self, five_x_five_user, user_integration, data_sync, lead_user):
        visited_url = self.get_first_visited_url(lead_user)
        user_text = self.generate_user_text(five_x_five_user, visited_url)
        if user_text in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return user_text
            
        return self.send_message_to_channels(user_text, user_integration.access_token, data_sync.list_id)
    
    def generate_user_text(self, five_x_five_user: FiveXFiveUser, visited_url) -> str:
        if not five_x_five_user.linkedin_url:
            return ProccessDataSyncResult.INCORRECT_FORMAT.value
        
        email_fields = [
            'business_email', 
            'personal_emails', 
            'additional_personal_emails',
        ]
        def get_valid_email(user) -> str:
            thirty_days_ago = datetime.now() - timedelta(days=30)
            thirty_days_ago_str = thirty_days_ago.strftime('%Y-%m-%d %H:%M:%S')
            verity = 0
            for field in email_fields:
                email = getattr(user, field, None)
                if email:
                    emails = extract_first_email(email)
                    for e in emails:
                        if e and field == 'business_email' and five_x_five_user.business_email_last_seen:
                            if five_x_five_user.business_email_last_seen.strftime('%Y-%m-%d %H:%M:%S') > thirty_days_ago_str:
                                return e.strip()
                        if e and field == 'personal_emails' and five_x_five_user.personal_emails_last_seen:
                            personal_emails_last_seen_str = five_x_five_user.personal_emails_last_seen.strftime('%Y-%m-%d %H:%M:%S')
                            if personal_emails_last_seen_str > thirty_days_ago_str:
                                return e.strip()
                        if e and self.million_verifier_integrations.is_email_verify(email=e.strip()):
                            return e.strip()
                        verity += 1
            if verity > 0:
                return ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value
            return ProccessDataSyncResult.INCORRECT_FORMAT.value

        first_email = get_valid_email(five_x_five_user)

        if first_email in (ProccessDataSyncResult.INCORRECT_FORMAT.value, ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value):
            return first_email

        data = {
            "LinkedIn URL": five_x_five_user.linkedin_url,
            "Name": f"{five_x_five_user.first_name} {five_x_five_user.last_name}".strip(),
            "Title": five_x_five_user.job_title,
            "Company": five_x_five_user.company_name,
            "Detail": f"{five_x_five_user.company_employee_count or 'Unknown Employees'} | "
                      f"{five_x_five_user.company_revenue or 'Unknown Revenue'} | "
                      f"{five_x_five_user.primary_industry or 'Unknown Industry'}",
            "Email": first_email,
            "Visited URL": visited_url,
            "Location": (
                f"{five_x_five_user.professional_city}, {five_x_five_user.professional_state}".strip(", ")
                if five_x_five_user.professional_city or five_x_five_user.professional_state
                else None
            ),
        }
        user_text = "\n".join([f"*{key}:* {value}" for key, value in data.items()])
        return user_text

    def get_channels(self, domain_id, user_id):
        user_integration = self.get_credential(domain_id, user_id)
        if user_integration:
            client = WebClient(token=user_integration.access_token)
            try:
                response = client.conversations_list()
                channels_data = response.get("channels", [])
                channels = [
                    {
                        'id': channel["id"],
                        'name': channel["name"]
                    }
                    for channel in channels_data
                ]
                return {'status': ProccessDataSyncResult.SUCCESS, 'channels': channels}
            except SlackApiError as e:
                logger.error(f"Slack API Error: {e.response.get('error')}")
                return {'status': ProccessDataSyncResult.AUTHENTICATION_FAILED}

        return {'status': ProccessDataSyncResult.AUTHENTICATION_FAILED}

    def send_message_to_channels(self, text, client_token, channel_id):
        client = WebClient(token=client_token)
        try:
            response = client.conversations_info(channel=channel_id)
            if not response["ok"] or not response["channel"]["is_member"]:
                logger.warning(f"Access to the channel #{channel_id} is denied.")
                return ProccessDataSyncResult.AUTHENTICATION_FAILED.value

            client.chat_postMessage(
                channel=channel_id,
                text=text
            )
            logger.info(f"The message has been sent to the channel: #{channel_id}")
            return ProccessDataSyncResult.SUCCESS.value

        except SlackApiError as e:
            logger.error(f"Slack API error: {e.response['error']}")
            return ProccessDataSyncResult.LIST_NOT_EXISTS.value
        
    async def create_sync(self, leads_type: str, list_id: str, list_name: str, domain_id: int, created_by: str, user: dict):
        credentials = self.integrations_persistence.get_credentials_for_service(domain_id=domain_id, user_id=user.get('id'), service_name=SourcePlatformEnum.SLACK.value)
        join_result = self.join_channel(credentials.access_token, list_id)
        if join_result['status'] == IntegrationsStatus.JOIN_CHANNEL_IS_FAILED.value:
            return join_result
        self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'created_by': created_by,
        })
