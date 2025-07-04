import asyncio
import httpx
import logging

logging.basicConfig(level=logging.INFO)

API_KEY = "pk_d93a2cef0f0305a87a23bcc0e2f2c59c9e"  # 🔒 Замени на свой
API_LIST_ID = "WGkQvn"  # 🔁 Замени на ID нужного листа
PROFILE_URL = "https://a.klaviyo.com/api/profiles/"
LIST_URL = (
    f"https://a.klaviyo.com/api/lists/{API_LIST_ID}/relationships/profiles/"
)

HEADERS = {
    "Authorization": f"Klaviyo-API-Key {API_KEY}",
    "revision": "2024-10-15",
    "Content-Type": "application/json",
}

# 🔧 Пример данных профиля
json_data = {
    "data": {
        "type": "profile",
        "attributes": {
            "email": "chelsieleigh86@gmail.com",
            "first_name": "John",
            "last_name": "Doe",
        },
    }
}


async def send_lead():
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            # 1. Отправляем профиль
            response = await client.post(
                PROFILE_URL, headers=HEADERS, json=json_data
            )
            logging.info(f"Create profile status: {response.status_code}")
            data = response.json()

            if response.status_code in (200, 201):
                profile_id = data["data"]["id"]
                logging.info(f"Profile created: {profile_id}")

                # 2. Добавляем профиль в список
                list_data = {"data": [{"type": "profile", "id": profile_id}]}

                list_response = await client.post(
                    LIST_URL, headers=HEADERS, json=list_data
                )
                logging.info(f"Add to list status: {list_response.status_code}")
                if list_response.status_code in (200, 201, 204):
                    logging.info(f"Successfully added to list {API_LIST_ID}")
                else:
                    logging.warning(
                        f"Failed to add to list: {list_response.text}"
                    )
            else:
                logging.warning(f"Failed to create profile: {data}")

        except httpx.HTTPError as e:
            logging.error(f"HTTP Error: {e}")
        except Exception as e:
            logging.error(f"Unhandled Error: {e}")


if __name__ == "__main__":
    asyncio.run(send_lead())
