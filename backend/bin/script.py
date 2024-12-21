import os
import shopify

# Создание сессии
with shopify.Session.temp('zahodi.myshopify.com', '2024-10', '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'):
    charge = shopify.ApplicationCharge.create({
        "name": 'Test One-time Payment',
        "price": 228,  # Сумма в долларах
        "return_url": 'https://dev.maximiz.ai/',
        "currency_code": 'usd',
        "test": True  # Для теста
    })

    # Получение URL подтверждения
    confirmation_url = charge.confirmation_url
    print(f"Redirect the client to: {confirmation_url}")

    # Клиент должен перейти по confirmation_url для подтверждения платежа
    # После подтверждения Shopify завершит платеж автоматически

    # Проверка статуса платежа
    charge.reload()  # Обновить данные о платеже
    if charge.status == 'accepted':
        print(f"Payment successfully processed for amount: {charge.price} {charge.currency_code}")
    else:
        print(f"Payment is still {charge.status}.")
