from fastapi import APIRouter, Depends, Query
from services.admin_customers import AdminCustomersService
from dependencies import get_admin_customers_service
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection

router = APIRouter()

@router.get("/confirm_customer")
async def verify_token(admin_customers_service: AdminCustomersService = Depends(get_admin_customers_service), mail: str = Query(...), free_trail: bool = Query(...)):
    user = admin_customers_service.confirmation_customer(mail, free_trail)
    queue_name = f'sse_events_{str(user.id)}'

    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()

    try:
        await publish_rabbitmq_message(
            connection=connection,
            queue_name=queue_name,
            message_body={'status': "BOOK_CALL_PASSED"}
        )
    except:
        await rabbitmq_connection.close()
    finally:
        await rabbitmq_connection.close()

    return "OK"

@router.get("/confirm_pixel_installation")
async def confirm_pixel():
    # Implementation here
    pass
