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


# import logging
# logging.basicConfig(level=logging.DEBUG)
# logging.getLogger('suds.client').setLevel(logging.DEBUG)

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
        
        
    
def get_customer_id(developer_token, client_id, client_secret, refresh_token):
    authentication = OAuthWebAuthCodeGrant(client_id=client_id, client_secret=client_secret, redirection_uri='http://localhost:3000/bing-ads-landing')
    authentication.request_oauth_tokens_by_refresh_token(refresh_token)
    authorization_data = AuthorizationData(developer_token=developer_token, authentication=authentication)
    customer_management_service = ServiceClient(service='CustomerManagementService', version=13, authorization_data=authorization_data)
    response = customer_management_service.GetUser()
    customer_id = response.User.CustomerId

    return customer_id


def create_bing_ads_audience(developer_token, client_id, client_secret, refresh_token, 
                               audience_name, description):
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

        # 2. Получаем информацию об аккаунте
        customer_service = ServiceClient(
            service='CustomerManagementService',
            version=13,
            authorization_data=authorization_data
        )
        
        # Получаем Customer ID
        user = customer_service.GetUser().User
        customer_id = user.CustomerId

        # Получаем список аккаунтов
        accounts = customer_service.SearchAccounts(
            Predicates={
                'Predicate': [{
                    'Field': 'UserId',
                    'Operator': 'Equals',
                    'Value': user.Id
                }]
            },
            PageInfo={'Index': 0, 'Size': 100}
        )

        if not accounts or not hasattr(accounts, 'AdvertiserAccount'):
            raise Exception("No advertiser accounts found for the user")
        # print(accounts.AdvertiserAccount)
        account_id = accounts.AdvertiserAccount[1].Id
        account_name = accounts.AdvertiserAccount[1].Name
        authorization_data.customer_id = customer_id
        authorization_data.account_id = account_id
        
        # 3. Создаем аудиторию через Campaign Management Service
        campaign_service = ServiceClient(
            service='CampaignManagementService',
            version=13,
            authorization_data=authorization_data
        )
        factory = campaign_service.factory

        # 4. Создаем объект аудитории согласно документации
        custom_audience = factory.create('CustomAudience')
        custom_audience.Name = audience_name
        custom_audience.Description = description
        custom_audience.MembershipDuration = 100  # Обязательное поле
        custom_audience.Scope = 'Account'         # Обязательное поле

        # 5. Формируем запрос согласно схеме API
        audiences = factory.create('ArrayOfAudience')
        audiences.Audience = [custom_audience]

        # 6. Вызов метода API для добавления аудитории
        add_response = campaign_service.AddAudiences(Audiences=audiences)

        # Проверка на наличие ошибок в ответе
        if hasattr(add_response, 'PartialErrors') and add_response.PartialErrors:
            for error in add_response.PartialErrors.BatchError:
                print("Ошибка:", error.ErrorCode, "-", error.Message)
            raise Exception("Custom audience could not be added. Проверьте, что аккаунт соответствует требованиям для ремаркетинга.")

        # Извлекаем ID аудитории
        audience_ids = []
        if hasattr(add_response, 'AudienceIds') and add_response.AudienceIds is not None:
            audience_ids = add_response.AudienceIds.long

        if audience_ids and len(audience_ids) > 0:
            return {
                'customer_id': customer_id,
                'account_id': account_id,
                'audience_id': audience_ids[0],
                'status': 'success'
            }
        else:
            return {
                'status': 'failed',
                'error': 'No audience ID was returned from AddAudiences'
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



def authenticate(developer_token, client_id, client_secret, refresh_token):
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
    return authorization_data

from bingads.v13.bulk.entities import BulkCustomerList, BulkCustomAudience
from bingads.v13.bulk import BulkServiceManager, EntityUploadParameters
from bingads.v13.bulk import BulkFileReader

from bingads.v13.bulk.entities import BulkCustomerList, BulkCustomerListItem
from bingads.v13.bulk import BulkServiceManager, EntityUploadParameters
from bingads.v13.bulk import BulkFileReader




# Пример использования:
async def main():
    developer_token = DEVELOPER_TOKEN
    access_token = get_access_token()
    #customer_id = CLIENT_ID
    #print(get_customer_id(developer_token, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN))
    #authorization_data = authenticate(developer_token, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)
    result = create_bing_ads_audience(
        developer_token=developer_token,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        refresh_token=REFRESH_TOKEN,
        audience_name="My Custom Audience",
        description="Audience created via API"
    )
    print(result)
    #customer_list_id = create_customer_list(authorization_data, 'test_list', 'customer_list_description', 123)
    #print(customer_list_id)
    # if customer_list_id:
    #     contacts = ['example1@example.com', 'example2@example.com']
    #     add_contacts_to_customer_list(authorization_data, customer_list_id, contacts)
    #     print(f'Список клиентов с ID {customer_list_id} создан и заполнен контактами.')
    # else:
    #     print('Не удалось создать список клиентов.')
   
# Запуск асинхронного main
if __name__ == "__main__":
    asyncio.run(main())