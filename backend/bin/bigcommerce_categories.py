import requests

store_hash = '23k6mb4fr5'
access_token = 'rsv2hj5p5cei9q6pie4epwnmhmj4ixo'
url = f'https://api.bigcommerce.com/stores/{store_hash}/v3/catalog/categories'

headers = {
    'X-Auth-Token': access_token,
    'Accept': 'application/json',
}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    categories = response.json()['data']
    for category in categories:
        print(f"ID: {category['id']}, Название: {category['name']}")
else:
    print(f"Ошибка: {response.status_code} - {response.text}")
