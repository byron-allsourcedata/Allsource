import logging
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from config.slack import SlackConfig
from fastapi import HTTPException
import json
from typing import List
from urllib.parse import unquote
import base64
from schemas.integrations.integrations import DataMap
from slack_sdk.oauth import AuthorizeUrlGenerator
from models.five_x_five_users import FiveXFiveUser
from persistence.user_persistence import UserPersistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from enums import SourcePlatformEnum, IntegrationsStatus, ProccessDataSyncResult
from persistence.integrations.integrations_persistence import IntegrationsPresistence

logger = logging.getLogger("slack")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)


class SlackService:
    def __init__(self, user_persistence: UserPersistence, user_integrations_persistence: IntegrationsPresistence, sync_persistence: IntegrationsUserSyncPersistence):
        self.user_persistence = user_persistence
        self.integrations_persistence = user_integrations_persistence
        self.sync_persistence = sync_persistence
        
    def get_credential(self, domain_id):
        return self.integrations_persistence.get_credentials_for_service(domain_id, SourcePlatformEnum.SLACK.value)
        
    def save_integration(self, domain_id: int, access_token: str, user: dict):
        credential = self.get_credential(domain_id)
        if credential:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.ALREADY_EXIST.value})
        integrations = self.integrations_persistence.create_integration({
            'domain_id': domain_id,
            'access_token': access_token,
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.SLACK.value
        })
        if not integrations:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return integrations
    
    def generate_authorize_url(self, user_id, domain_id):
        state_payload = json.dumps({"user_id": user_id, "domain_id": domain_id})
        state = base64.urlsafe_b64encode(state_payload.encode()).decode()

        generator = AuthorizeUrlGenerator(
            client_id=SlackConfig.client_id,
            scopes=[
                "channels:read",
                "groups:read",
                "channels:history",
                "groups:history",
                "channels:manage",
                "groups:write",
                "channels:join",
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
        state = self.decode_state(state)
        user_id = state.get('user_id')
        domain_id = state.get('domain_id')
        client = WebClient()
        response = client.oauth_v2_access(
            client_id = SlackConfig.client_id,
            client_secret = SlackConfig.client_secret,
            code=code,
            redirect_uri=SlackConfig.redirect_url
        )
        if response['ok']:
            slack_user_id = response['authed_user']['id']
            slack_bot_token = response['access_token']
            user = self.user_persistence.get_user_by_id(user_id)
            if user:
                self.save_integration(domain_id, slack_bot_token, user)
                return {"message": "User authenticated and saved!", "user_id": slack_user_id}
            else:
                raise SlackApiError(status_code=404, detail="User not found")
        else:
            raise SlackApiError(status_code=400, detail="OAuth failed")
    
    def create_channel(client_token, channel_name, is_private=False):
        client = WebClient(token=client_token)
        
        try:
            response = client.conversations_create(
                name=channel_name,
                is_private=is_private
            )
            if response["ok"]:
                return {
                    "status": "success",
                    "channel": response["channel"]
                }
        except SlackApiError as e:
            error_message = e.response.get("error", "unknown_error")
            return {
                "status": "failed",
                "error": error_message
            }
    
    def join_channel(client_token, channel_id):
        client = WebClient(token=client_token)
        try:
            response = client.conversations_join(channel=channel_id)
            
            if response["ok"]:
                channel_info = response["channel"]
                print(f"Successfully joined the channel: #{channel_info['name']}")
                return channel_info
            else:
                print(f"Failed to join the channel: {response['error']}")
                return {"error": response['error']}
        except SlackApiError as e:
            print(f"Slack API error: {e.response['error']}")
            return {"error": e.response['error']}
    
    async def process_data_sync(self, five_x_five_user, user_integration, data_sync):
        user_text = self.generate_user_text(five_x_five_user)
        return self.send_message_to_channels(user_text, user_integration.access_token)
    
    def generate_user_text(self, five_x_five_user: FiveXFiveUser) -> str:
        linkedin_url = five_x_five_user.linkedin_url or "N/A"
        name = f"{five_x_five_user.first_name} {five_x_five_user.last_name}".strip() or "N/A"
        title = five_x_five_user.job_title or "N/A"
        company = five_x_five_user.company_name or "N/A"
        company_employee_count = five_x_five_user.company_employee_count or "Unknown Employees"
        company_revenue = five_x_five_user.company_revenue or "Unknown Revenue"
        primary_industry = five_x_five_user.primary_industry or "Unknown Industry"
        company_details = f"{company_employee_count} | {company_revenue} | {primary_industry}"
        email = five_x_five_user.business_email or "N/A"
        page_url = five_x_five_user.professional_address or "N/A"
        location = (
            f"{five_x_five_user.professional_city}, {five_x_five_user.professional_state}"
            if five_x_five_user.professional_city and five_x_five_user.professional_state
            else "N/A"
        )
        user_text = (
            f"LinkedIn URL (Person): {linkedin_url}\n"
            f"Name: {name}\n"
            f"Title (Job Title): {title}\n"
            f"Company: {company}\n"
            f"Detail: {company_details}\n"
            f"Email: {email}\n"
            f"Page URL (Which page user visited on the website): {page_url}\n"
            f"Location: {location}\n"
        )

        return user_text
    
    def get_channels(self, domain_id):
        user_integration = self.get_credential(domain_id)
        if user_integration:
            client = WebClient(token=user_integration.access_token)
            try:
                response = client.conversations_list()
                channels_data = response.get("channels", [])
                channels = [
                    {
                        'id': channel["id"],
                        'channel_name': channel["name"]
                    }
                    for channel in channels_data
                ]
                return channels
            except SlackApiError as e:
                logger.error(f"Slack API Error: {e.response.get('error')}")
                return ProccessDataSyncResult.AUTHENTICATION_FAILED

        return ProccessDataSyncResult.AUTHENTICATION_FAILED
        
    def send_message_to_channels(self, text, client_token, channel_id):
        client = WebClient(token=client_token)
        try:
            response = client.conversations_info(channel=channel_id)
            if not response["ok"] or not response["channel"]["is_member"]:
                logger.warning(f"Access to the channel #{channel_id} is denied.")
                return ProccessDataSyncResult.AUTHENTICATION_FAILED

            client.chat_postMessage(
                channel=channel_id,
                text=text
            )
            logger.info(f"The message has been sent to the channel: #{channel_id}")
            return ProccessDataSyncResult.SUCCESS

        except SlackApiError as e:
            logger.error(f"Slack API error: {e.response['error']}")
            return ProccessDataSyncResult.LIST_NOT_EXISTS
        
    async def create_sync(self, leads_type: str, list_id: str, list_name: str, data_map: List[DataMap], domain_id: int, created_by: str):
        credentials = self.integrations_persistence.get_credentials_for_service(domain_id, SourcePlatformEnum.SLACK.value)
        data_syncs = self.sync_persistence.get_filter_by(domain_id=domain_id)
        for sync in data_syncs:
            if sync.get('integration_id') == credentials.id and sync.get('leads_type') == leads_type:
                return
        sync = self.sync_persistence.create_sync({
            'integration_id': credentials.id,
            'list_id': list_id,
            'list_name': list_name,
            'domain_id': domain_id,
            'leads_type': leads_type,
            'data_map': data_map,
            'created_by': created_by,
        })
