import requests
import json

from bingads import ServiceClient, AuthorizationData, OAuthWebAuthCodeGrant
from suds import WebFault
from bingads.authorization import OAuthDesktopMobileAuthCodeGrant
import sys
from bingads.authorization import AuthorizationData, OAuthWebAuthCodeGrant
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
        
        

import requests
import xml.etree.ElementTree as ET

CUSTOMER_MGMT_ENDPOINT = "https://api.bingads.microsoft.com/Api/CustomerManagement/v13/CustomerManagementService.svc"

import requests
import xml.etree.ElementTree as ET

def get_user_info(developer_token, access_token):
    get_user_request = f'''<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v13="https://bingads.microsoft.com/Customer/v13">
        <soapenv:Header>
            <v13:DeveloperToken>{developer_token}</v13:DeveloperToken>
            <v13:AuthenticationToken>{access_token}</v13:AuthenticationToken>
        </soapenv:Header>
        <soapenv:Body>
            <v13:GetUserRequest>
                <v13:UserId xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:nil="true"/>
            </v13:GetUserRequest>
        </soapenv:Body>
    </soapenv:Envelope>'''

    headers = {
        "Content-Type": "text/xml",
        "SOAPAction": "GetUser"
    }

    uri = "https://clientcenter.api.bingads.microsoft.com/Api/CustomerManagement/v13/CustomerManagementService.svc"

    response = requests.post(uri, data=get_user_request, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"Ошибка HTTP {response.status_code}: {response.text}")

    # Парсинг XML-ответа
    root = ET.fromstring(response.content)
    ns = {
        "s": "http://schemas.xmlsoap.org/soap/envelope/",
        "c": "https://bingads.microsoft.com/Customer/v13",
        "a": "https://bingads.microsoft.com/Customer/v13/Entities"
    }
    print(response.text)
    user_id_elem = root.find(".//a:Id", ns)
    if user_id_elem is None:
        raise Exception("Не удалось найти UserId в ответе GetUser")
    
    user_id = user_id_elem.text
    return {"UserId": user_id, "RawResponse": response.text}


def search_accounts(user_id, developer_token, auth_token, page_index=0, page_size=10):
    """
    Выполняет поиск аккаунтов для указанного user_id через операцию SearchAccounts.
    Возвращает список аккаунтов с идентификаторами CustomerId и AccountId.
    """
    soap_envelope = f'''<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Header>
    <h:ApplicationToken xmlns:h="https://bingads.microsoft.com/Customer/v13" i:nil="true"/>
    <h:AuthenticationToken xmlns:h="https://bingads.microsoft.com/Customer/v13">{auth_token}</h:AuthenticationToken>
    <h:DeveloperToken xmlns:h="https://bingads.microsoft.com/Customer/v13">{developer_token}</h:DeveloperToken>
  </s:Header>
  <s:Body>
    <SearchAccountsRequest xmlns="https://bingads.microsoft.com/Customer/v13">
      <Predicates xmlns:a="https://bingads.microsoft.com/Customer/v13/Entities">
        <a:Predicate>
          <a:Field>UserId</a:Field>
          <a:Operator>Equals</a:Operator>
          <a:Value>{user_id}</a:Value>
        </a:Predicate>
      </Predicates>
      <Ordering i:nil="true" xmlns:a="https://bingads.microsoft.com/Customer/v13/Entities"/>
      <PageInfo xmlns:a="https://bingads.microsoft.com/Customer/v13/Entities">
        <a:Index>{page_index}</a:Index>
        <a:Size>{page_size}</a:Size>
      </PageInfo>
    </SearchAccountsRequest>
  </s:Body>
</s:Envelope>'''

    headers = {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "SearchAccounts"
    }
    
    response = requests.post(CUSTOMER_MGMT_ENDPOINT, data=soap_envelope, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Ошибка SearchAccounts: {response.status_code} - {response.text}")
    
    # Парсинг XML-ответа для извлечения информации об аккаунтах
    root = ET.fromstring(response.content)
    ns = {"s": "http://schemas.xmlsoap.org/soap/envelope/",
          "c": "https://bingads.microsoft.com/Customer/v13",
          "a": "https://bingads.microsoft.com/Customer/v13/Entities"}
    
    accounts = []
    # Ожидается, что в ответе вернется список AccountInfo элементов
    for account_elem in root.findall(".//a:AccountInfo", ns):
        customer_id = account_elem.find("a:CustomerId", ns).text if account_elem.find("a:CustomerId", ns) is not None else None
        account_id = account_elem.find("a:AccountId", ns).text if account_elem.find("a:AccountId", ns) is not None else None
        account_name = account_elem.find("a:AccountName", ns).text if account_elem.find("a:AccountName", ns) is not None else None
        accounts.append({
            "CustomerId": customer_id,
            "AccountId": account_id,
            "AccountName": account_name
        })
    return accounts

# Пример использования:
if __name__ == "__main__":
    # Эти значения должны быть получены заранее (из настроек или переменных окружения)
    DEV_TOKEN = DEVELOPER_TOKEN
    AUTH_TOKEN = get_access_token()
    
    try:
        user_info = get_user_info(DEV_TOKEN, AUTH_TOKEN)
        user_id = user_info["UserId"]
        print("Получен UserId:", user_id)
        
        accounts = search_accounts(user_id, DEV_TOKEN, AUTH_TOKEN)
        print("Найденные аккаунты:")
        for acc in accounts:
            print(f"AccountName: {acc['AccountName']}, CustomerId: {acc['CustomerId']}, AccountId: {acc['AccountId']}")
    except Exception as e:
        print("Ошибка:", e)

