import requests
import json

def create_contact_list(access_token, list_name):
    url = "https://graph.microsoft.com/v1.0/me/contactFolders"
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        "displayName": list_name,
        "isHidden": False
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 201:
        print(f"Список '{list_name}' успешно создан.")
        return response.json()
    else:
        print(f"Ошибка создания списка: {response.text}")
        return None


def get_contact_lists(access_token):
    url = "https://graph.microsoft.com/v1.0/me/contactFolders"
    
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        contact_lists = response.json().get("value", [])
        print("Все списки контактов:")
        for list_item in contact_lists:
            print(f"- {list_item['displayName']}")
        return contact_lists
    else:
        print(f"Ошибка получения списков: {response.text}")
        return None


def add_contact_to_list(access_token, contact_list_id, contact_data):
    url = f"https://graph.microsoft.com/v1.0/me/contactFolders/{contact_list_id}/contacts"
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(url, headers=headers, json=contact_data)
    
    if response.status_code == 201:
        print(f"Контакт успешно добавлен в список '{contact_list_id}'.")
        return response.json()
    else:
        print(f"Ошибка при добавлении контакта: {response.text}")
        return None


# Пример данных для контакта
contact_data = {
    "givenName": "Иван",
    "surname": "Иванов",
    "emailAddresses": [
        {
            "address": "ivanov@example.com",
            "name": "Иван Иванов"
        }
    ]
}

# Ваш access token
access_token = 'ВАШ_ACCESS_TOKEN'

# Шаг 1: Создание списка
list_name = "Мой новый список"
created_list = create_contact_list(access_token, list_name)

# Шаг 2: Получение всех списков
contact_lists = get_contact_lists(access_token)

# Шаг 3: Добавление контакта в только что созданный список
if created_list:
    contact_list_id = created_list.get("id")
    added_contact = add_contact_to_list(access_token, contact_list_id, contact_data)
    print(f"Добавленный контакт: {added_contact}")
