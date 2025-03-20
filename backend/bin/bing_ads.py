import requests
import json

from bingads import ServiceClient, AuthorizationData, OAuthWebAuthCodeGrant
from suds import WebFault
from bingads.authorization import OAuthDesktopMobileAuthCodeGrant
import sys
import requests
import xml.etree.ElementTree as ET
from bingads.service_client import ServiceClient
import webbrowser
from time import gmtime, strftime


REFRESH_TOKEN = '1.AQwAoMOu-2xxzUSHxit-r-dIM4Ptp6kjpBNHnTQjJkaFg4HdAIoMAA.AgABAwEAAABVrSpeuWamRam2jAF1XRQEAwDs_wUA9P9Kh_KBfIRvhn6k64ckST7syJs4Rk7GnYLE_ar97A_cZHzpSdPF14hGpwk4hnDiFm-VRkPafqf9BTBDuyFox9kv_dP2P4OJC_xgP0kW2ohDS30PnoqgQOhfr3CnXiivawplJiQ97I0RKdQYz0QP0g4S3SAHqQv7zGy5I0ymCqdmK-9ozguZPSldH0GgR_CpdveqPs2k53Ouo3cQFCVX4lpnJ_bQlUOSfyNf--fUaI6rS3RTH5i8pcMjxX8Nhz1bNgV-1z_LDWS8v9ctBTBMnUw0puFRZhiwIgyq7F4TQFNyIq3w6qe8OsLcZwRgKZrmN0ZuMJZO_ji9_Kc4H8Z85Uek_ClgWrEXsKJwgk_PKVjkVICyzo4wLPXSZsPXZ-hYwEpayOGsHYXAyiyFFoPHeF-EeBED0nSgasJ0ds5fwIBiaYhx1T-nAV9SD44mmY7IKn0CAKr8ReabbuccGa5B9lQY30ocFAEpFYPCLhENdHgY2ILtKhXf73MtQBIRzruYXPhYDU1Te_rq9ps-H7dDzSBq2SW2V3dDwF2p-PWccxNazATrKqrzwmsb_I8U2UDwZZEbxVbYPoJ6AzAo4VOrq89MOu4UkxRiFy5vHRKws6K9NdKkU33ggiEfuOpd8FvnLN7eWDLL9fSMw4j3xaFaGqsTEzUoOhAjcZVGR41zUEZ2MYU6ZTZXLvQQFiwnuX7s9W9ffU8wJ0aiQXJIg54ikLIr3P3lB5v4kG2nASMZroKsosCa3jIJDdk1s4aSqIVfBlwUoqbCTzDeSCRdQM86e0ePfU2kIGPHXN_laCGuu6G04g'
CLIENT_ID = 'a9a7ed83-a423-4713-9d34-232646858381'
CLIENT_SECRET = 'DpX8Q~Ur~HQJUHF53lvtQil~uqrWknS3oSZkldlL'
DEVELOPER_TOKEN = '1451H5GIKV096293'
REDIRECT_URI = 'http://localhost:3000/bing-ads-landing'
ACCOUNT_ID = '187022038'
CUSTOMER_ID = '254340122'
SCOPE = 'https://ads.microsoft.com/.default'


def get_access_token():
    token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    data = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': 'refresh_token',
        'refresh_token': REFRESH_TOKEN,
        'scope': 'https://ads.microsoft.com/.default'
    }
    response = requests.post(token_url, data=data)

    if response.status_code == 200:
        access_token = response.json().get("access_token")
        print("Новый токен доступа получен")
        return access_token
    else:
        print(f"Ошибка при получении токена: {response.text}")
        exit()
        
        
access_token = get_access_token()

from bingads.authorization import AuthorizationData, OAuthWebAuthCodeGrant


def authenticate(access_token):
    authorization_data = AuthorizationData(
        developer_token=DEVELOPER_TOKEN,
        authentication=None,
        customer_id=CUSTOMER_ID,
        account_id=ACCOUNT_ID,
    )

    oauth_authentication = OAuthWebAuthCodeGrant(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirection_uri=REDIRECT_URI
    )
    
    oauth_authentication.state = 'YourState'
    oauth_authentication.token = {
        'access_token': access_token,
        'refresh_token': REFRESH_TOKEN,
        'expires_in': 3600,
        'token_type': 'Bearer'
    }
    
    authorization_data.authentication = oauth_authentication
    return authorization_data


from bingads.service_client import ServiceClient

def create_campaign(authorization_data, campaign_name, daily_budget, language='English', time_zone='PacificTimeUSCanadaTijuana'):
    """
    Создаёт кампанию с заданными параметрами.
    """
    campaign_service = ServiceClient(
        service='CampaignManagementService',
        version=13,
        authorization_data=authorization_data,
        environment='production'
    )

    campaign = {
        'Name': campaign_name,
        'Description': 'Описание кампании',
        'BudgetType': 'DailyBudgetStandard',
        'DailyBudget': daily_budget,
        'TimeZone': time_zone,
        'Language': language
        # Можно добавить и другие параметры по необходимости
    }

    try:
        response = campaign_service.AddCampaigns(
            AccountId=authorization_data.account_id,
            Campaigns=[campaign]
        )
        campaign_ids = response['CampaignIds']
        print(f'Кампания создана с ID: {campaign_ids[0]}')
        return campaign_ids[0]
    except Exception as ex:
        print(f'Ошибка при создании кампании: {ex}')
        return None

def create_audience(authorization_data, audience_name, description, membership_duration, scope):
    """
    Создаёт список аудитории (remarketing list) с заданными параметрами.
    - membership_duration: продолжительность членства (например, 30 дней)
    - scope: область применения, например, 'Account' или 'Customer'
    """
    audience_service = ServiceClient(
        service='AudienceManagementService',
        version=13,
        authorization_data=authorization_data,
        environment='production'
    )

    audience = {
        'Name': audience_name,
        'Description': description,
        'MembershipDuration': membership_duration,
        'Scope': scope,
        'AudienceType': 'RemarketingList'
    }

    try:
        response = audience_service.AddAudiences(Audiences=[audience])
        audience_ids = response['AudienceIds']
        print(f'Список аудитории создан с ID: {audience_ids[0]}')
        return audience_ids[0]
    except Exception as ex:
        print(f'Ошибка при создании списка аудитории: {ex}')
        return None

def update_audience_memberships(authorization_data, audience_id, members_to_add, members_to_remove=None):
    """
    Обновляет список аудитории, добавляя (и/или удаляя) участников.
    - members_to_add: список значений (например, email-адресов или других идентификаторов, возможно, в хешированном виде)
    - members_to_remove: опционально, список значений для удаления
    """
    audience_service = ServiceClient(
        service='AudienceManagementService',
        version=13,
        authorization_data=authorization_data,
        environment='production'
    )

    membership_changes = {
        'AudienceId': audience_id,
        'AddMembers': members_to_add,
        'RemoveMembers': members_to_remove if members_to_remove else []
    }

    try:
        response = audience_service.UpdateAudienceMemberships(MembershipChanges=[membership_changes])
        print(f'Обновление списка аудитории (ID: {audience_id}) прошло успешно.')
        return response
    except Exception as ex:
        print(f'Ошибка при обновлении списка аудитории: {ex}')
        return None

authorization_data = authenticate(access_token=access_token)

# Создание кампании
campaign_id = create_campaign(
    authorization_data=authorization_data,
    campaign_name='Тестовая кампания',
    daily_budget=50.0,
    language='English',
    time_zone='PacificTimeUSCanadaTijuana'
)

# Создание списка аудитории
# audience_id = create_audience(
#     authorization_data=authorization_data,
#     audience_name='Тестовый список аудитории',
#     description='Описание тестового списка',
#     membership_duration=30,
#     scope='Account'
# )

# # Заполнение списка аудитории
# # Пример: список участников (здесь значения могут требовать хеширования)
# members_to_add = [
#     'example1@example.com',
#     'example2@example.com'
# ]

# update_audience_memberships(
#     authorization_data=authorization_data,
#     audience_id=audience_id,
#     members_to_add=members_to_add
# )
