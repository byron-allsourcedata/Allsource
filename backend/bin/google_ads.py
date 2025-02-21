import requests

# Замените на ваши значения
# CLIENT_ID = 'ваш_client_id'
# CLIENT_SECRET = 'ваш_client_secret'
# REFRESH_TOKEN = 'ваш_refresh_token'
# DEVELOPER_TOKEN = 'ваш_developer_token'
# CUSTOMER_ID = 'ваш_customer_id'
ACCESS_TOKEN = 'ya29.a0AXeO80T2C-QGAWbkB_Nz4kLQ6Cs_t90lK6hf0SbopvtvgehhXh0U7u5sWTfkCK6Dd5g7ouaMU6u_ULH7GW9qgq7q7DCUsD1yCpPIzicoq34H5v_dfkIkqEtgDxdlUXFF4cBkmNtHVz76fzR7SVugWl2QYfZSvvAar_zqNIKNaCgYKAVwSARESFQHGX2Mi9_77tLBZy2W_sJVsQMXDcQ0175'
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json",
}

# Запрос списка доступных клиентов
response = requests.get(
    "https://googleads.googleapis.com/v13/customers:listAccessibleCustomers",
    headers=headers,
)

if response.status_code == 200:
    print("Список клиентов:", response.json())
else:
    print(f"Ошибка: {response.status_code}")
    print(response.text)
# })

# # Пример отправки контактов
# def upload_contacts(customer_id, contacts):
#     try:
#         # Создание сервиса для работы с пользовательскими списками
#         service = client.get_service('CustomerUserAccessService', version='v6')

#         # Создание запроса для добавления контактов
#         operations = []
#         for contact in contacts:
#             operation = client.get_type('CustomerUserAccessOperation')
#             user_access = operation.create
#             user_access.email_address = contact['email']
#             user_access.access_role = client.get_type('AccessRoleEnum').STANDARD
#             operations.append(operation)

#         # Отправка запроса
#         response = service.mutate_customer_user_access(customer_id, operations)

#         print(f"Успешно добавлено {len(response.results)} контактов.")
#     except GoogleAdsException as ex:
#         print(f"Ошибка: {ex}")

# # Пример использования
# contacts = [
#     {'email': 'example1@example.com'},
#     {'email': 'example2@example.com'},
# ]

# upload_contacts(CUSTOMER_ID, contacts)