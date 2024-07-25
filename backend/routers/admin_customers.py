from fastapi import APIRouter, Depends, Query
from services.admin_customers import AdminCustomersService
from dependencies import get_admin_customers_service
# from config.rmq_connection import publish_rabbitmq_message

router = APIRouter()

@router.get("/confirm_customer")
async def verify_token(admin_customers_service: AdminCustomersService = Depends(get_admin_customers_service), mail: str = Query(...), free_trail: bool = Query(...)):
    user = admin_customers_service.confirmation_customer(mail, free_trail)
    queue_name = f'sse_events_{str(user.id)}'

    # await publish_rabbitmq_message(
    #     queue_name=queue_name,
    #     message_body={'status': "BOOK_CALL_PASSED"}
    # )

    return "OK"

@router.get("/confirm_pixel_installation")
async def confirm_pixel():
    # Implementation here
    pass

@router.get("/test")
async def test(admin_customers_service: AdminCustomersService = Depends(get_admin_customers_service), mail: str = Query(...)):
    user = admin_customers_service.confirmation_customer(mail, free_trail=True)
    queue_name = 'sse_events_112'

    # await publish_rabbitmq_message(
    #     queue_name=queue_name,
    #     message_body={'hello': 1235}
    # )

    return 'OK'
