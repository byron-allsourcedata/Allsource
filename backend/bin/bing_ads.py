import requests
from bingads import ServiceClient, AuthorizationData, OAuthWebAuthCodeGrant
from bingads.v13.bulk import BulkServiceManager, EntityUploadParameters, BulkFileReader
from bingads.v13.bulk.entities import BulkCustomerList
from bingads.service_client import AuthorizationData, ServiceClient
from bingads.v13 import *
from bingads.v13.bulk import BulkServiceManager, BulkCustomAudience, BulkFileReader
from bingads.v13.bulk.entities.audiences import BulkCustomAudience
from bingads.v13.bulk import BulkServiceManager, BulkFileReader
import requests
import requests
import xml.etree.ElementTree as ET
import time
import requests
import time
import time
import asyncio
from bingads.v13.bulk import BulkServiceManager, BulkCustomAudience, BulkFileReader, EntityUploadParameters
from bingads.v13.bulk.entities import *
from bingads.v13.bulk.enums import *
from bingads.v13.internal.bulk.entities import *
import csv
import time
import requests
from bingads.service_client import ServiceClient


REFRESH_TOKEN = '1.AQwAoMOu-2xxzUSHxit-r-dIM4Ptp6kjpBNHnTQjJkaFg4HdAIoMAA.AgABAwEAAABVrSpeuWamRam2jAF1XRQEAwDs_wUA9P9Kh_KBfIRvhn6k64ckST7syJs4Rk7GnYLE_ar97A_cZHzpSdPF14hGpwk4hnDiFm-VRkPafqf9BTBDuyFox9kv_dP2P4OJC_xgP0kW2ohDS30PnoqgQOhfr3CnXiivawplJiQ97I0RKdQYz0QP0g4S3SAHqQv7zGy5I0ymCqdmK-9ozguZPSldH0GgR_CpdveqPs2k53Ouo3cQFCVX4lpnJ_bQlUOSfyNf--fUaI6rS3RTH5i8pcMjxX8Nhz1bNgV-1z_LDWS8v9ctBTBMnUw0puFRZhiwIgyq7F4TQFNyIq3w6qe8OsLcZwRgKZrmN0ZuMJZO_ji9_Kc4H8Z85Uek_ClgWrEXsKJwgk_PKVjkVICyzo4wLPXSZsPXZ-hYwEpayOGsHYXAyiyFFoPHeF-EeBED0nSgasJ0ds5fwIBiaYhx1T-nAV9SD44mmY7IKn0CAKr8ReabbuccGa5B9lQY30ocFAEpFYPCLhENdHgY2ILtKhXf73MtQBIRzruYXPhYDU1Te_rq9ps-H7dDzSBq2SW2V3dDwF2p-PWccxNazATrKqrzwmsb_I8U2UDwZZEbxVbYPoJ6AzAo4VOrq89MOu4UkxRiFy5vHRKws6K9NdKkU33ggiEfuOpd8FvnLN7eWDLL9fSMw4j3xaFaGqsTEzUoOhAjcZVGR41zUEZ2MYU6ZTZXLvQQFiwnuX7s9W9ffU8wJ0aiQXJIg54ikLIr3P3lB5v4kG2nASMZroKsosCa3jIJDdk1s4aSqIVfBlwUoqbCTzDeSCRdQM86e0ePfU2kIGPHXN_laCGuu6G04g'
CLIENT_ID = 'a9a7ed83-a423-4713-9d34-232646858381'
CLIENT_SECRET = 'DpX8Q~Ur~HQJUHF53lvtQil~uqrWknS3oSZkldlL'
DEVELOPER_TOKEN = '1451H5GIKV096293'
REDIRECT_URI = 'http://localhost:3000/bing-ads-landing'
SCOPE = 'https://ads.microsoft.com/.default'


import logging
logging.basicConfig(level=logging.DEBUG)
logging.getLogger('suds.client').setLevel(logging.DEBUG)
logging.getLogger('suds.transport.http').setLevel(logging.DEBUG)

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
        
        

from bingads.service_client import ServiceClient
from bingads.authorization import AuthorizationData, OAuthWebAuthCodeGrant

def _get_authorization_data(developer_token, client_id, client_secret, refresh_token):
    auth = OAuthWebAuthCodeGrant(
        client_id=client_id,
        client_secret=client_secret,
        redirection_uri='http://localhost:3000/bing-ads-landing'
    )
    auth.request_oauth_tokens_by_refresh_token(refresh_token)
    return AuthorizationData(developer_token=developer_token, authentication=auth)

def _setup_services(auth_data):
    # CustomerManagement для получения customer_id и account_id
    customer_service = ServiceClient(
        service='CustomerManagementService',
        version=13,
        authorization_data=auth_data
    )
    user = customer_service.GetUser().User
    auth_data.customer_id = user.CustomerId

    accounts = customer_service.SearchAccounts(
        Predicates={'Predicate': [{
            'Field': 'UserId', 'Operator': 'Equals', 'Value': user.Id
        }]},
        PageInfo={'Index': 0, 'Size': 100}
    )
    auth_data.account_id = accounts.AdvertiserAccount[0].Id

    # CampaignManagement для работы с аудиториями
    campaign_service = ServiceClient(
        service='CampaignManagementService',
        version=13,
        authorization_data=auth_data
    )
    return campaign_service


def add_emails_to_audience(developer_token, client_id, client_secret, refresh_token,
                           audience_id: int, emails: list[str]):
    """
    Добавляет список e‑mail в уже существующую аудиторию.
    """
    auth_data = _get_authorization_data(developer_token, client_id, client_secret, refresh_token)
    campaign_service = _setup_services(auth_data)
    factory = campaign_service.factory

    # Готовим объект CustomerList с ID аудитории
    customer_list = factory.create('CustomerList')
    customer_list.Id = audience_id

    # Формируем элементы списка
    items_array = factory.create('ArrayOfCustomerListItem')
    item_objs = []
    for email in emails:
        item = factory.create('CustomerListItem')
        item.SubType = 'Email'
        item.Text = email
        item_objs.append(item)
    items_array.CustomerListItem = item_objs
    customer_list.CustomerListItems = items_array

    # Вызываем ApplyCustomerListItems для добавления контактов
    response = campaign_service.ApplyCustomerListItems(CustomerListAudience=customer_list)
    return response.PartialErrors  # пустой список при успешном добавлении
    
def set_bing_ads_audience_contacts(developer_token, client_id, client_secret, refresh_token,
                                   audience_id, contacts):
    try:
        # 1. Аутентификация с OAuth 2.0
        authentication = OAuthWebAuthCodeGrant(
            client_id=client_id,
            client_secret=client_secret,
            redirection_uri='http://localhost:3000/bing-ads-landing'
        )
        authentication.request_oauth_tokens_by_refresh_token(refresh_token)
        
        authorization_data = AuthorizationData(
            developer_token=developer_token,
            authentication=authentication
        )
        
        # 2. Инициализация клиента CampaignManagementService
        campaign_service = ServiceClient(
            service='CampaignManagementService',
            version=13,
            authorization_data=authorization_data
        )
        factory = campaign_service.factory
        
        # 3. Формирование массива объектов AudienceContact
        audience_contacts_array = factory.create('ArrayOfAudienceContact')
        audience_contacts = []
        for contact in contacts:
            audience_contact = factory.create('AudienceContact')
            audience_contact.FirstName = contact.get('first_name')
            audience_contact.LastName = contact.get('last_name')
            audience_contact.Email = contact.get('email')
            audience_contact.PhoneNumber = contact.get('phone')
            audience_contacts.append(audience_contact)
        audience_contacts_array.AudienceContact = audience_contacts
        
        # 4. Вызов метода API для установки контактов аудитории
        response = campaign_service.SetAudienceContacts(
            AudienceId=audience_id,
            AudienceContacts=audience_contacts_array
        )
        
        # 5. Проверка ответа на наличие ошибок
        if hasattr(response, 'PartialErrors') and response.PartialErrors:
            errors = []
            for error in response.PartialErrors.BatchError:
                errors.append({
                    'code': error.ErrorCode,
                    'message': error.Message
                })
            raise Exception("Errors while setting audience contacts: " + str(errors))
        
        return {
            'status': 'success',
            'audience_id': audience_id
        }
    
    except Exception as e:
        error_info = {
            'status': 'failed',
            'error': str(e)
        }
        # Если доступна информация о SOAP fault, добавляем её в ошибку
        if hasattr(e, 'fault'):
            fault_detail = e.fault.detail
            error_info['tracking_id'] = getattr(fault_detail, 'TrackingId', None)
            if hasattr(fault_detail, 'ApiFault'):
                api_errors = []
                for error in fault_detail.ApiFault.OperationErrors.OperationError:
                    api_errors.append({
                        'code': error.Code,
                        'message': error.Message
                    })
                error_info['api_errors'] = api_errors
        
        return error_info


from datetime import date
from bingads import OAuthWebAuthCodeGrant, AuthorizationData, ServiceClient
from suds import WebFault

from typing import List, Optional


import requests
from typing import Optional, List
from datetime import date

def create_campaign(
    developer_token: str,
    client_id: str,
    client_secret: str,
    refresh_token: str,
    campaign_name: str,
    daily_budget: float,
    budget_type: str = 'DailyBudgetStandard',
    time_zone: str = 'EasternTimeUSCanada',
    languages: Optional[List[str]] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> int:
    # 1. Obtain OAuth tokens
    auth = OAuthWebAuthCodeGrant(
        client_id=client_id,
        client_secret=client_secret,
        redirection_uri='http://localhost:3000/bing-ads-landing'
    )
    auth.request_oauth_tokens_by_refresh_token(refresh_token)

    # 2. Prepare the request body
    campaigns = [{
        "Name": campaign_name,
        "DailyBudget": daily_budget,
        "BudgetType": budget_type,
        "TimeZone": time_zone,
        "Status": "Paused",
        "BiddingScheme": {"Type": "EnhancedCpcBiddingScheme"},
        "CampaignType": ["Search"],
        "Languages": languages if languages else ["Russian"],
        "StartDate": start_date.isoformat() if start_date else None,
        "EndDate": end_date.isoformat() if end_date else None
    }]

    # 3. Set headers
    headers = {
        'Authorization': f'Bearer {auth.authentication_token}',
        'CustomerId': str(auth.customer_id),
        'DeveloperToken': developer_token,
        'CustomerAccountId': str(auth.account_id),
        'Content-Type': 'application/json'
    }

    # 4. Make the API call
    url = 'https://api.bingads.microsoft.com/v13/campaignmanagement/AddCampaigns'
    response = requests.post(url, json={"AccountId": auth.account_id, "Campaigns": campaigns}, headers=headers)

    # 5. Handle the response
    if response.status_code == 200:
        response_data = response.json()
        campaign_ids = response_data.get('CampaignIds', [])
        if campaign_ids:
            return campaign_ids[0]
        else:
            raise Exception("Failed to create campaign. No campaign ID returned.")
    else:
        raise Exception(f"API call failed with status code {response.status_code}: {response.text}")






# def add_audiences_to_campaign(developer_token: str,
#                               client_id: str,
#                               client_secret: str,
#                               refresh_token: str,
#                               campaign_id: int,
#                               audience_ids: List[int]) -> None:
#     """
#     Ассоциирует список аудиторий (audience_ids) с кампанией campaign_id.

#     Использует метод AddCampaignCriterions с CriterionType='Audience' :contentReference[oaicite:1]{index=1}.
#     """
#     # 1. Аутентификация и AuthorizationData
#     auth = OAuthWebAuthCodeGrant(
#         client_id=client_id,
#         client_secret=client_secret,
#         redirection_uri='http://localhost:3000/bing-ads-landing'
#     )
#     auth.request_oauth_tokens_by_refresh_token(refresh_token)
#     authorization_data = AuthorizationData(
#         developer_token=developer_token,
#         authentication=auth
#     )

#     # 2. Получаем customer_id и account_id
#     cust_svc = ServiceClient(
#         service='CustomerManagementService',
#         version=13,
#         authorization_data=authorization_data
#     )
#     user = cust_svc.GetUser().User
#     authorization_data.customer_id = user.CustomerId

#     accounts = cust_svc.SearchAccounts(
#         Predicates={'Predicate': [{
#             'Field': 'UserId',
#             'Operator': 'Equals',
#             'Value': user.Id
#         }]},
#         PageInfo={'Index': 0, 'Size': 100}
#     )
#     authorization_data.account_id = accounts.AdvertiserAccount[0].Id

#     # 3. Инициализация CampaignManagementService
#     campaign_svc = ServiceClient(
#         service='CampaignManagementService',
#         version=13,
#         authorization_data=authorization_data,
#         environment='production'
#     )
#     factory = campaign_svc.factory

#     # 4. Формируем массив критериев для аудиторий
#     arr_criteria = factory.create('ArrayOfCampaignCriterion')
#     arr_criteria.CampaignCriterion = []
#     for aud_id in audience_ids:
#         bcc = factory.create('BiddableCampaignCriterion')
#         bcc.CampaignId = campaign_id
#         aud = factory.create('AudienceCriterion')
#         aud.AudienceId = aud_id
#         bcc.Criterion = aud
#         arr_criteria.CampaignCriterion.append(bcc)

#     # 5. Добавляем аудитории к кампании
#     resp = campaign_svc.AddCampaignCriterions(
#         CampaignCriterions=arr_criteria,
#         CriterionType='Audience'
#     )
#     if hasattr(resp, 'NestedPartialErrors') and resp.NestedPartialErrors:
#         raise Exception("Не удалось добавить аудитории. См. NestedPartialErrors.")



# Пример использования:
async def main():
    refresh_token = '1.AQwAoMOu-2xxzUSHxit-r-dIM4Ptp6kjpBNHnTQjJkaFg4HdAM8MAA.AgABAwEAAABVrSpeuWamRam2jAF1XRQEAwDs_wUA9P_-g8ZHqXoih_Zz0tYRVRrzFKeA6Wh8c5uwnBcEtqSg4zVHClEnwmZ2nQbIboy4tm3WksZcR9VOBBjHJVTGjNcsHqsmy9QQCkjo49407sk21tqwJ2BSyu__HeIdOaRdnY03M60ONWvksU-LrH62XPUnnN9gNFhkZFrULsFGKQaBONYLy8ten2dM8urPIeX0Z4oxxQUDQ1_ARh5lGJ__XydZTdXz9kVCr6T7U_4PsdchZgx5g7eq8xJHeSVdDkaLcJ8eM3pQ529qZcU50kt5eGURM7k4uoYKV0NH6MZk-2Wuf3lBq1m77DPg5sHnKRXD-IykWtOTvK0j8DxUjbAn6wvTV_24Ul1OgTZc1YeT246bNWNUY44WZfb0CQ4aOcepgx_hpbGd2eNlPntnF8IHQInp4EfHznBRiSrf-BWL2AwjgIZoGfUg1biNE2IFoUh3Va4zqIWd1N8TpWiFP50o2ZUPFw6EfZiXfjuuo4spYfvlxungfvBDtEhh5STxNGHYIUJicBG5rIZeMSLJe42wEA5GepbyU9GTo9RccifVFWzo-JimS7twA8oNhvwd054WCeiruUDVkOijwMi7SPdGFQbx3hDIYbhD3oQLh9MBfLAJDcSMm98JFBhZXj8_Rrr0NHutD6W_XEjZSGMNVsjguNEwp0bTQDtdcTFvlLhaWrFWUcyK5YfbtTuOfNor7o6rTznEM_35mSmAWVztnhNe1SHNc3IaIBbUcc_RNarGWjYWX2LXMLytR38LGm0qII_Xd4WcE_mTR-CpiDZ-r-uI__ejXvX3TumB1FsiHB0PBa02PivPca5sMhR6'
    print(create_campaign(DEVELOPER_TOKEN, CLIENT_ID, CLIENT_SECRET, refresh_token, 'campaign_name', 100.0))
# Запуск асинхронного main
if __name__ == "__main__":
    asyncio.run(main())