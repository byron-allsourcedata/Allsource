import requests
import json

from bingads import ServiceClient, AuthorizationData, OAuthWebAuthCodeGrant
from suds import WebFault
from bingads import ServiceClient, AuthorizationData, OAuthWebAuthCodeGrant
from bingads.service_client import _CAMPAIGN_OBJECT_FACTORY_V13
from suds import WebFault
import sys
import webbrowser
from time import gmtime, strftime


REFRESH_TOKEN = '1.AQwAoMOu-2xxzUSHxit-r-dIM4Ptp6kjpBNHnTQjJkaFg4HdAIoMAA.AgABAwEAAABVrSpeuWamRam2jAF1XRQEAwDs_wUA9P9Kh_KBfIRvhn6k64ckST7syJs4Rk7GnYLE_ar97A_cZHzpSdPF14hGpwk4hnDiFm-VRkPafqf9BTBDuyFox9kv_dP2P4OJC_xgP0kW2ohDS30PnoqgQOhfr3CnXiivawplJiQ97I0RKdQYz0QP0g4S3SAHqQv7zGy5I0ymCqdmK-9ozguZPSldH0GgR_CpdveqPs2k53Ouo3cQFCVX4lpnJ_bQlUOSfyNf--fUaI6rS3RTH5i8pcMjxX8Nhz1bNgV-1z_LDWS8v9ctBTBMnUw0puFRZhiwIgyq7F4TQFNyIq3w6qe8OsLcZwRgKZrmN0ZuMJZO_ji9_Kc4H8Z85Uek_ClgWrEXsKJwgk_PKVjkVICyzo4wLPXSZsPXZ-hYwEpayOGsHYXAyiyFFoPHeF-EeBED0nSgasJ0ds5fwIBiaYhx1T-nAV9SD44mmY7IKn0CAKr8ReabbuccGa5B9lQY30ocFAEpFYPCLhENdHgY2ILtKhXf73MtQBIRzruYXPhYDU1Te_rq9ps-H7dDzSBq2SW2V3dDwF2p-PWccxNazATrKqrzwmsb_I8U2UDwZZEbxVbYPoJ6AzAo4VOrq89MOu4UkxRiFy5vHRKws6K9NdKkU33ggiEfuOpd8FvnLN7eWDLL9fSMw4j3xaFaGqsTEzUoOhAjcZVGR41zUEZ2MYU6ZTZXLvQQFiwnuX7s9W9ffU8wJ0aiQXJIg54ikLIr3P3lB5v4kG2nASMZroKsosCa3jIJDdk1s4aSqIVfBlwUoqbCTzDeSCRdQM86e0ePfU2kIGPHXN_laCGuu6G04g'
CLIENT_ID = 'a9a7ed83-a423-4713-9d34-232646858381'
CLIENT_SECRET = 'DpX8Q~Ur~HQJUHF53lvtQil~uqrWknS3oSZkldlL'
DEVELOPER_TOKEN = '1451H5GIKV096293'
REDIRECT_URI = 'http://localhost:3000/bing-ads-landing'
ACCOUNT_ID = '254340122'
CUSTOMER_ID = '187022038'

# Инициализация авторизационных данных
authorization_data = AuthorizationData(
    account_id=ACCOUNT_ID,
    customer_id=CUSTOMER_ID,
    developer_token=DEVELOPER_TOKEN,
    authentication=None
)

# Создание объекта OAuthWebAuthCodeGrant
authentication = OAuthWebAuthCodeGrant(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    redirection_uri=REDIRECT_URI,
)

# Установка токена обновления и получение токена доступа
authentication.request_oauth_tokens_by_refresh_token(REFRESH_TOKEN)
authorization_data.authentication = authentication

# Создание клиента для CampaignManagementService
campaign_service = ServiceClient(
    service='CampaignManagementService',
    version=13,
    authorization_data=authorization_data,
    environment='production'
)

# Функция для создания пользовательской аудитории
def create_custom_audience():
    try:
        # Создание объекта CustomAudience
        audience = _CAMPAIGN_OBJECT_FACTORY_V13.create('CustomAudience')
        audience.Name = 'Моя пользовательская аудитория'
        audience.Description = 'Описание моей пользовательской аудитории'
        audience.MembershipDuration = 30  # Длительность членства в днях
        audience.Scope = 'Account'  # Или 'Customer' в зависимости от области применения

        # Вызов метода для создания аудитории
        response = campaign_service.AddAudiences(Audiences={'Audience': [audience]})
        audience_ids = response.AudienceIds['long']
        print(f'Аудитория успешно создана с ID: {audience_ids[0]}')
    except WebFault as e:
        print(f'Ошибка при создании аудитории: {e}')

# Вызов функции для создания аудитории
create_custom_audience()



# def get_new_access_token(client_id, client_secret, refresh_token):
#     url = f"https://login.microsoftonline.com/common/oauth2/v2.0/token"
#     data = {
#         'client_id': client_id,
#         'client_secret': client_secret,
#         'grant_type': 'refresh_token',
#         'refresh_token': refresh_token,
#         'scope': 'https://graph.microsoft.com/.default'
#     }
#     response = requests.post(url, data=data)
#     if response.status_code == 200:
#         new_access_token = response.json().get("access_token")
#         return new_access_token
#     else:
#         print(f"Ошибка при получении нового токена: {response.text}")
#         return None


# refresh_token = '1.AQwAoMOu-2xxzUSHxit-r-dIM2gwuquIY9JNiXfcfHi5StndABgMAA.AgABAwEAAABVrSpeuWamRam2jAF1XRQEAwDs_wUA9P8Gb44tFaH7C4LiSqVTff_WipQsTxP0SKguzOGgDPnxH8BnAUcIFPl2OjMU90GWKoK26DciOr_aA9Dd9YPgL9zccb-rIqMaZUWWxVuyKY86LwYJYbqtZ0BZyB6dH13_xB618yLA4RfN5CQsGwv0988_VGbD9TisHC8x6PHlZ-rCZXUyvx2wKFHIQKclEjlb_dKCGE6OhlAeb192b323iX1Yjdzgy8zbMWd8ptAaTUp8AiVzljFVhHR8Jb1JTMzOgsfHdr6ngWrbvvuAflhz4PiWsQF0hNOk2vqfejhXfVgWBWp2qtDYwKO8PD8TQYC_M6-nZmZSXVzSYS2gy-BZfQ5EpPfj-fALBZU2WlvF2s8Y6ZU-aB5-eJt0VVR3M3tsLKhpeFMABmco-8KCR5E90yEUpm0rmT8S2JT3cIbj00Zl9QBcc4yjcEQdvPTnpnte_b7iNjBM-jzad-aVoplCmT7tOzDTTjoLsls0nx9Zf-CeQPZewl9s8HzZskFemuB7WX4lWeTnAssXr5IqZrq6E7EcdjwNeZ_Y7IhdVEfslRQZtoe77aChP75dqlchPBlr6PKSdG4lpwLC-TFeet_cuZsc5MdWwMn7iRAc4QjQGXdEJ2lZQ0x2inuvavAR4G5sMS5ld-ixSqBo_-cEDvzFCpPcYGw6ZqPE0ESTOchRslah8Z4vutMkPGZknMr-_WMGnHfz439bfzKUJ90zC_OoNhjR1v4DarGmmcSAjBCJoVom5g'
# client_id = 'abba3068-6388-4dd2-8977-dc7c78b94ad9'
# client_secret = '5Ju8Q~orrF638Y.NsqXzvV0VT3ookTbGPmtqWbPT'
# access_token = get_new_access_token(client_id, client_secret, refresh_token)

# list_name = "Мой новый список"
# created_list = create_contact_list(access_token, list_name)

# # Шаг 2: Получение всех списков
# contact_lists = get_contact_lists(access_token)

# # Шаг 3: Добавление контакта в только что созданный список
# if created_list:
#     contact_list_id = created_list.get("id")
#     added_contact = add_contact_to_list(access_token, contact_list_id, contact_data)
#     print(f"Добавленный контакт: {added_contact}")
