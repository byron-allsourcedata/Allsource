import requests
import base64

api_key = 'cbhxPEv5gD2VLghK7WFfaNPD'
api_secret = 'qpTFFsvpaLdGFX4FhDUmbtWE'
domain = 'maximiz.mykajabi.com'

token = base64.b64encode(f"{api_key}:{api_secret}".encode()).decode()

contact_data = {
    "email": "example@example.com",
    "first_name": "Иван",
    "last_name": "Иванов",
    "phone": "+1234567890",  # Опционально
    "tags": ["тег1", "тег2"]  # Опционально
}

# Заголовки
headers = {
    "Authorization": f"Basic {token}",
    "Content-Type": "application/json"
}

# Отправка запроса
response = requests.post(
    'https://app.kajabi.com/api/v1/contacts',
    json=contact_data,
    headers=headers
)

# Проверка ответа
if response.status_code == 201:
    print("Контакт успешно создан!")
else:
    print(f"Ошибка: {response.status_code}, {response.text}")