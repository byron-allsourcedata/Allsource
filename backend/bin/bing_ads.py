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


from bingads.v13.bulk import BulkServiceManager, FileUploadParameters, ResultFileType
import hashlib

def hash_emails(emails: list[str]) -> list[str]:
    return [
        hashlib.sha256(email.strip().lower().encode('utf-8')).hexdigest()
        for email in emails
    ]

def add_emails_to_audience(developer_token, client_id, client_secret,
                           refresh_token,
                           audience_id: int, emails: list[str]):
     # 1. Аутентификация
    auth = OAuthWebAuthCodeGrant(
        client_id=client_id,
        client_secret=client_secret,
        redirection_uri='http://localhost:3000/bing-ads-landing'
    )
    auth.request_oauth_tokens_by_refresh_token(refresh_token)

    # 2. Формируем AuthorizationData
    authorization_data = AuthorizationData(
        developer_token=developer_token,
        authentication=auth
    )

    # 3. Получаем customer_id и account_id
    cust_svc = ServiceClient(
        service='CustomerManagementService',
        version=13,
        authorization_data=authorization_data,
        environment='production'
    )
    user = cust_svc.GetUser().User
    authorization_data.customer_id = user.CustomerId

    accounts = cust_svc.SearchAccounts(
        Predicates={'Predicate': [{
            'Field': 'UserId',
            'Operator': 'Equals',
            'Value': user.Id
        }]},
        PageInfo={'Index': 0, 'Size': 100}
    )
    authorization_data.account_id = accounts.AdvertiserAccount[0].Id

    # 3. Инициализация BulkServiceManager
    bulk_manager = BulkServiceManager(
        authorization_data=authorization_data,
        environment='production',
        poll_interval_in_milliseconds=5000
    )

    # 4. Хешируем e‑mail’ы
    sha256_hashes = [
        hashlib.sha256(email.strip().lower().encode('utf-8')).hexdigest()
        for email in emails
    ]

    # 5. Собираем сущности для загрузки
    entities = [
        BulkCustomerList(                    # ссылка на существующую аудиторию
            CustomerList={'Id': audience_id},
            Action='Replace'                 # Replace удалит старые и добавит новые
        )
    ]
    for h in sha256_hashes:
        entities.append(
            BulkCustomerListItem(            # Item с SHA‑256‑хешем
                CustomerListItem={
                    'ParentId': audience_id,
                    'SubType': 'Email',
                    'Text': h
                }
            )
        )

    # 6. Загружаем файл и получаем результаты
    upload_params = FileUploadParameters(
        entities=entities,
        result_file_directory='.',
        result_file_name='results.csv',
        response_mode='ErrorsAndResults'
    )
    result_path = bulk_manager.upload_file(upload_params)
    results = bulk_manager.download_file(
        download_entities=['CustomerList', 'CustomerListItem'],
        download_file_path=result_path,
        result_file_type=ResultFileType.upload
    )

    return results  # можно разобрать результаты в results.csv
    
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


def create_campaign(
    developer_token: str,
    client_id: str,
    client_secret: str,
    refresh_token: str,
    campaign_name: str,
    daily_budget: float,
    campaign_type: str = 'Search',
    budget_type: str = 'DailyBudgetStandard',
    languages: Optional[List[str]] = None
) -> int:
    # 1. Аутентификация
    auth = OAuthWebAuthCodeGrant(
        client_id=client_id,
        client_secret=client_secret,
        redirection_uri='http://localhost:3000/bing-ads-landing'
    )
    auth.request_oauth_tokens_by_refresh_token(refresh_token)

    # 2. Формируем AuthorizationData
    authorization_data = AuthorizationData(
        developer_token=developer_token,
        authentication=auth
    )

    # 3. Получаем customer_id и account_id
    cust_svc = ServiceClient(
        service='CustomerManagementService',
        version=13,
        authorization_data=authorization_data,
        environment='production'
    )
    user = cust_svc.GetUser().User
    authorization_data.customer_id = user.CustomerId

    accounts = cust_svc.SearchAccounts(
        Predicates={'Predicate': [{
            'Field': 'UserId',
            'Operator': 'Equals',
            'Value': user.Id
        }]},
        PageInfo={'Index': 0, 'Size': 100}
    )
    authorization_data.account_id = accounts.AdvertiserAccount[0].Id

    # 4. Инициализируем CampaignManagementService
    campaign_service = ServiceClient(
        service='CampaignManagementService',
        version=13,
        authorization_data=authorization_data,
        environment='production'
    )

    # Создание схемы ставок
    bidding_scheme = campaign_service.factory.create('EnhancedCpcBiddingScheme')
    # Создание объекта кампании
    campaign = campaign_service.factory.create('Campaign')
    target_setting_detail = campaign_service.factory.create('TargetSettingDetail')
    target_setting_detail.CriterionTypeGroup = 'Audience'
    target_setting_detail.TargetAndBid = True
    campaign.TargetSetting = [target_setting_detail]
    
    campaign.Name = campaign_name
    campaign.DailyBudget = daily_budget
    campaign.BudgetType = budget_type
    campaign.Status = 'Paused'
    campaign.BiddingScheme = bidding_scheme
    campaign.CampaignType = ['Search']
    campaign.Languages = {'string': ['All']}

    # Добавление кампании
    campaigns = campaign_service.factory.create('ArrayOfCampaign')
    campaigns.Campaign.append(campaign)

    try:
        response = campaign_service.AddCampaigns(
            AccountId=authorization_data.account_id,
            Campaigns=campaigns
        )
        if response and response.CampaignIds and response.CampaignIds['long']:
            return response.CampaignIds['long'][0]
        else:
            # Check for partial errors
            if response and response.PartialErrors and response.PartialErrors['BatchError']:
                for error in response.PartialErrors['BatchError']:
                    if error.Code == 1115:
                        raise Exception("A campaign with the same name already exists. Please choose a different name.")
                    else:
                        raise Exception(f"Error {error.Code}: {error.Message}")
            else:
                raise Exception("Failed to create campaign. API response does not contain campaign ID.")
    except WebFault as e:
        raise Exception(f"Error creating campaign: {e}")

from bingads.v13.bulk import BulkServiceManager, EntityUploadParameters
from bingads.v13.bulk.entities import BulkAdGroup

from bingads.v13.bulk import BulkServiceManager, EntityUploadParameters
from bingads.v13.bulk.entities import BulkAdGroup
from bingads.authorization import OAuthWebAuthCodeGrant
from bingads import AuthorizationData

from bingads.authorization import OAuthWebAuthCodeGrant, AuthorizationData
from bingads.v13.bulk import BulkServiceManager, EntityUploadParameters
from bingads.v13.bulk.entities import BulkAdGroup


from bingads.authorization import OAuthWebAuthCodeGrant, AuthorizationData
from bingads.service_client import ServiceClient
from bingads.v13.bulk import BulkServiceManager, EntityUploadParameters
from bingads.v13.bulk.entities import BulkAdGroup

def create_ad_group_bulk(developer_token: str, client_id: str, client_secret: str, refresh_token: str,
                         campaign_id: int, ad_group_name: str) -> int:
    # Аутентификация и авторизация
    auth = OAuthWebAuthCodeGrant(
        client_id=client_id,
        client_secret=client_secret,
        redirection_uri='http://localhost:3000/bing-ads-landing'
    )
    auth.request_oauth_tokens_by_refresh_token(refresh_token)
    authorization_data = AuthorizationData(
        developer_token=developer_token,
        authentication=auth
    )

    # 2. Через CustomerManagementService получаем CustomerId и AccountId
    cust_svc = ServiceClient(
        service='CustomerManagementService',
        version=13,
        authorization_data=authorization_data
    )
    user = cust_svc.GetUser().User
    authorization_data.customer_id = user.CustomerId

    accounts = cust_svc.SearchAccounts(
        Predicates={'Predicate': [{
            'Field': 'UserId',
            'Operator': 'Equals',
            'Value': user.Id
        }]},
        PageInfo={'Index': 0, 'Size': 100}
    )
    # Выбираем нужный аккаунт (например, первый в списке)
    account = accounts.AdvertiserAccount[0]
    authorization_data.account_id = account.Id

    # Формирование AuthorizationData
    authorization_data = AuthorizationData(
        account_id=authorization_data.account_id,
        customer_id=authorization_data.customer_id,
        developer_token=developer_token,
        authentication=auth
    )

    # Инициализация BulkServiceManager
    bulk_service_manager = BulkServiceManager(
        authorization_data=authorization_data,
        environment='production'
    )

    # Инициализация клиента службы Campaign Management
    campaign_service = ServiceClient(
        service='CampaignManagementService',
        version=13,
        authorization_data=authorization_data,
        environment='production'
    )

    # Создание экземпляра AdGroup с использованием фабрики клиента
    ad_group = campaign_service.factory.create('AdGroup')
    ad_group.Name = ad_group_name
    ad_group.Status = 'Paused'
    ad_group.Language = 'All'
    ad_group.CpcBid = campaign_service.factory.create('Bid')
    ad_group.CpcBid.Amount = 0.25

    # Создание BulkAdGroup и присвоение AdGroup
    bulk_ad_group = BulkAdGroup()
    bulk_ad_group.campaign_id = campaign_id
    bulk_ad_group.ad_group = ad_group

    # Параметры загрузки
    upload_parameters = EntityUploadParameters([bulk_ad_group])

    # Загрузка данных
    upload_result = bulk_service_manager.upload_entities(upload_parameters)
    for result in upload_result:
        # Assuming the result contains the uploaded BulkAdGroup
        uploaded_ad_group = result
        print(f"Uploaded AdGroup ID: {uploaded_ad_group.ad_group}")



def add_customer_list_to_campaign_bulk(
    developer_token: str,
    client_id: str,
    client_secret: str,
    refresh_token: str,
    campaign_id: int,
    customer_list_id: int,
    bid_adjustment: float = 0.0,
    result_file_directory: str = '.',
    result_file_name: str = 'bulk_results.csv'
) -> None:
    # 1. Аутентификация и подготовка AuthorizationData
    auth = OAuthWebAuthCodeGrant(
        client_id=client_id,
        client_secret=client_secret,
        redirection_uri='http://localhost:3000/bing-ads-landing'
    )
    auth.request_oauth_tokens_by_refresh_token(refresh_token)
    authorization_data = AuthorizationData(
        developer_token=developer_token,
        authentication=auth
    )

    # 2. Через CustomerManagementService получаем CustomerId и AccountId
    cust_svc = ServiceClient(
        service='CustomerManagementService',
        version=13,
        authorization_data=authorization_data
    )
    user = cust_svc.GetUser().User
    authorization_data.customer_id = user.CustomerId

    accounts = cust_svc.SearchAccounts(
        Predicates={'Predicate': [{
            'Field': 'UserId',
            'Operator': 'Equals',
            'Value': user.Id
        }]},
        PageInfo={'Index': 0, 'Size': 100}
    )
    # Выбираем нужный аккаунт (например, первый в списке)
    account = accounts.AdvertiserAccount[0]
    authorization_data.account_id = account.Id

    # 3. Создаём через CampaignManagementService фабрику для BiddableCampaignCriterion
    campaign_svc = ServiceClient(
        service='CampaignManagementService',
        version=13,
        authorization_data=authorization_data,
        environment='production'
    )
    factory = campaign_svc.factory

    # 4. Строим BiddableCampaignCriterion
    bcc = factory.create('BiddableCampaignCriterion')
    bcc.Status = 'Paused'
    bcc.CampaignId = campaign_id

    bcc.Criterion = factory.create('AudienceCriterion')
    bcc.Criterion.Type = None
    bcc.Criterion.AudienceId = customer_list_id

    bcc.CriterionBid = factory.create('BidMultiplier')
    bcc.CriterionBid.Type = None
    bcc.CriterionBid.Multiplier = bid_adjustment

    # 5. Оборачиваем в BulkCampaignCustomerListAssociation
    assoc = BulkCampaignCustomerListAssociation(
        biddable_campaign_criterion=bcc,
        campaign_name=None,
        audience_name=None
    )

    # 6. Инициализируем BulkServiceManager и параметры загрузки
    bulk_manager = BulkServiceManager(
        authorization_data=authorization_data,
        environment='production'
    )
    upload_params = EntityUploadParameters(
        entities=[assoc],
        result_file_directory=result_file_directory,
        result_file_name=result_file_name,
        overwrite_result_file=True,
        response_mode='ErrorsAndResults'
    )

    # 7. Загружаем и проверяем результат
    for bulk_entity in bulk_manager.upload_entities(upload_params):
        if isinstance(bulk_entity, BulkCampaignCustomerListAssociation):
            if hasattr(bulk_entity, 'has_errors') and bulk_entity.has_errors:
                print("Ошибки при загрузке:")
                for error in bulk_entity.errors:
                    for attr in dir(error):
                        if not attr.startswith('_'):
                            value = getattr(error, attr)
                            print(f"{attr}: {value}")
            else:
                print(f"Success: CampaignId={bulk_entity.biddable_campaign_criterion.CampaignId}, "
                      f"AudienceId={bulk_entity.biddable_campaign_criterion.Criterion.AudienceId}, "
                      f"Status={bulk_entity.biddable_campaign_criterion.Status}")
        else:
            print(f"Received unexpected entity type: {type(bulk_entity)}")

    print("CustomerList успешно добавлен к кампании через Bulk API")
    




# Пример использования:
async def main():
    refresh_token = '1.AQwAoMOu-2xxzUSHxit-r-dIM4Ptp6kjpBNHnTQjJkaFg4HdAM8MAA.AgABAwEAAABVrSpeuWamRam2jAF1XRQEAwDs_wUA9P_-g8ZHqXoih_Zz0tYRVRrzFKeA6Wh8c5uwnBcEtqSg4zVHClEnwmZ2nQbIboy4tm3WksZcR9VOBBjHJVTGjNcsHqsmy9QQCkjo49407sk21tqwJ2BSyu__HeIdOaRdnY03M60ONWvksU-LrH62XPUnnN9gNFhkZFrULsFGKQaBONYLy8ten2dM8urPIeX0Z4oxxQUDQ1_ARh5lGJ__XydZTdXz9kVCr6T7U_4PsdchZgx5g7eq8xJHeSVdDkaLcJ8eM3pQ529qZcU50kt5eGURM7k4uoYKV0NH6MZk-2Wuf3lBq1m77DPg5sHnKRXD-IykWtOTvK0j8DxUjbAn6wvTV_24Ul1OgTZc1YeT246bNWNUY44WZfb0CQ4aOcepgx_hpbGd2eNlPntnF8IHQInp4EfHznBRiSrf-BWL2AwjgIZoGfUg1biNE2IFoUh3Va4zqIWd1N8TpWiFP50o2ZUPFw6EfZiXfjuuo4spYfvlxungfvBDtEhh5STxNGHYIUJicBG5rIZeMSLJe42wEA5GepbyU9GTo9RccifVFWzo-JimS7twA8oNhvwd054WCeiruUDVkOijwMi7SPdGFQbx3hDIYbhD3oQLh9MBfLAJDcSMm98JFBhZXj8_Rrr0NHutD6W_XEjZSGMNVsjguNEwp0bTQDtdcTFvlLhaWrFWUcyK5YfbtTuOfNor7o6rTznEM_35mSmAWVztnhNe1SHNc3IaIBbUcc_RNarGWjYWX2LXMLytR38LGm0qII_Xd4WcE_mTR-CpiDZ-r-uI__ejXvX3TumB1FsiHB0PBa02PivPca5sMhR6'
    #create_campaign(DEVELOPER_TOKEN, CLIENT_ID, CLIENT_SECRET, refresh_token, 'teww', 123)
    # create_ad_group_bulk(DEVELOPER_TOKEN,CLIENT_ID,CLIENT_SECRET,refresh_token, 569722874, 'ad_name')
    # add_customer_list_to_campaign_bulk(DEVELOPER_TOKEN, CLIENT_ID, CLIENT_SECRET,refresh_token,569722874,822093753)
    add_emails_to_audience(DEVELOPER_TOKEN, CLIENT_ID, CLIENT_SECRET, refresh_token, 569722874, ["email@gmail.com", "email1@gmail.com", "email2@gmail.com"])
# Запуск асинхронного main
if __name__ == "__main__":
    asyncio.run(main())