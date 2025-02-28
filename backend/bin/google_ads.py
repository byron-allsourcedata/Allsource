from google.auth import exceptions
from google.auth.transport.requests import Request
from google.ads.googleads.client import GoogleAdsClient
from google.auth.credentials import Credentials
import google.auth

# Настройка с параметрами без использования google-ads.yaml
developer_token = 'Abw4KBOMdzaUAag-Pox8bQ'
client_id = '1001249123388-16u7qafkkra58hcig94o28mpc1baeqf8.apps.googleusercontent.com'
client_secret = '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'
refresh_token = '1//018-58ZTB4rxHCgYIARAAGAESNwF-L9IrYGZ9ZTf0rPHnx6DYDKeYQNlhnnuypEPrMOk3SfbWuGd3SF1sTLQtUj5sOO8E5AM0-fs'
customer_id = '559-168-1182'

def create_google_ads_client():
    # Создайте учетные данные с помощью refresh_token
    credentials, project = google.auth.default()
    
    # Настроим учетные данные для OAuth2
    credentials = credentials.with_access_token(refresh_token)

    # Передайте их в Google Ads Client
    google_ads_client = GoogleAdsClient.load_from_storage(version="v18")
    
    # Инициализация клиента с ручной настройкой
    google_ads_client = GoogleAdsClient(credentials=credentials, developer_token=developer_token)
    
    return google_ads_client


# Используем наш клиент для выполнения операций
def main(client, customer_id):
    custom_audience_service = client.get_service("CustomAudienceService")
    custom_audience_operation = client.get_type("CustomAudienceOperation")
    
    custom_audience = custom_audience_operation.create
    custom_audience.name = "My Custom Audience"
    custom_audience.description = "Custom audience based on search terms"
    custom_audience.type_ = client.enums.CustomAudienceTypeEnum.SEARCH
    custom_audience.status = client.enums.CustomAudienceStatusEnum.ENABLED

    # Пример создания и добавления участников
    member1 = create_custom_audience_member(client, client.enums.CustomAudienceMemberTypeEnum.KEYWORD, "mars cruise")
    custom_audience.members.append(member1)

    # Выполнение операции
    custom_audience_response = custom_audience_service.mutate_custom_audiences(
        customer_id=customer_id, operations=[custom_audience_operation]
    )
    print(f"New custom audience added: {custom_audience_response.results[0].resource_name}")


def create_custom_audience_member(client, member_type, value):
    member = client.get_type("CustomAudienceMember")
    member.member_type = member_type
    if member_type == client.enums.CustomAudienceMemberTypeEnum.KEYWORD:
        member.keyword = value
    elif member_type == client.enums.CustomAudienceMemberTypeEnum.URL:
        member.url = value
    elif member_type == client.enums.CustomAudienceMemberTypeEnum.APP:
        member.app = value
    return member


if __name__ == "__main__":
    try:
        google_ads_client = create_google_ads_client()
        main(google_ads_client, customer_id)
    except exceptions.GoogleAuthError as ex:
        print(f'Error: {ex}')