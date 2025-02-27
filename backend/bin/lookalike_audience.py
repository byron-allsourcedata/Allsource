def create_lookalike_audience(customer_id, base_user_list_id, percentage=3):
    # Получение сервиса для создания списка пользователей
    user_list_service = client.get_service("UserListService")

    # Создание операции для добавления Lookalike Audience
    user_list_operation = client.get_type("UserListOperation")
    user_list = user_list_operation.create
    user_list.name = f"Lookalike Audience {percentage}%"
    user_list.description = f"Lookalike audience based on {base_user_list_id} with {percentage}% similarity"
    user_list.membership_status = client.get_type("UserListMembershipStatusEnum").OPEN

    # Применение процента схожести
    user_list.similarity_percentage = percentage

    # Указание исходного списка для создания Lookalike Audience
    user_list.similarity_source = base_user_list_id

    # Отправка запроса на создание списка
    try:
        response = user_list_service.mutate_user_lists(customer_id=customer_id, operations=[user_list_operation])
        print(f"Lookalike Audience '{user_list.name}' created with ID: {response.results[0].resource_name}")
        return response.results[0].resource_name
    except GoogleAdsException as ex:
        print(f"Google Ads API request failed: {ex}")
        return None

# Пример использования:
base_user_list_id = "INSERT_BASE_USER_LIST_ID"
customer_id = "INSERT_YOUR_CUSTOMER_ID_HERE"
create_lookalike_audience(customer_id, base_user_list_id, percentage=3)
