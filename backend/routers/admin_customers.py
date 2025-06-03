from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, HTTPException

from schemas.admin import InviteDetailsRequest
from services.admin_customers import AdminCustomersService
from dependencies import get_admin_customers_service, check_user_admin
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from schemas.users import UpdateUserRequest, UpdateUserResponse

router = APIRouter()


@router.get("/confirm_customer")
async def verify_token(admin_customers_service: AdminCustomersService = Depends(get_admin_customers_service),
                       mail: str = Query(...), free_trial: bool = Query(...), user: dict = Depends(check_user_admin)):
    user = admin_customers_service.confirmation_customer(mail, free_trial)
    queue_name = f'sse_events_{str(user.id)}'
    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()
    try:
        await publish_rabbitmq_message(
            connection=connection,
            queue_name=queue_name,
            message_body={'status': "BOOK_CALL_PASSED", 'percent': 50}
        )
    except:
        await rabbitmq_connection.close()
    finally:
        await rabbitmq_connection.close()
    return "OK"


@router.get('/users')
async def get_users(
        user: dict = Depends(check_user_admin),
        sort_by: str = Query(None, description="Field"),
        sort_order: str = Query(None, description="Field to sort by: 'asc' or 'desc'"),
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        last_login_date_start: int = Query(None, description="Start date in integer format"),
        search_query: str = Query(None, description="Search for email, account name"),
        last_login_date_end: int = Query(None, description="End date in integer format"),
        join_date_start: int = Query(None, description="Start date in integer format"),
        join_date_end: int = Query(None, description="End date in integer format"),
        per_page: int = Query(9, alias="per_page", ge=1, le=500, description="Items per page"),
        admin_customers_service: AdminCustomersService = Depends(get_admin_customers_service)):
    users = admin_customers_service.get_customer_users(search_query=search_query, page=page, per_page=per_page, sort_by=sort_by, sort_order=sort_order,
                                                       last_login_date_start=last_login_date_start, last_login_date_end=last_login_date_end, join_date_start=join_date_start,
                                                       join_date_end=join_date_end)
    return users


@router.get('/admins')
async def get_admins(
        user: dict = Depends(check_user_admin),
        sort_by: str = Query(None, description="Field"),
        sort_order: str = Query(None, description="Field to sort by: 'asc' or 'desc'"),
        page: int = Query(1, alias="page", ge=1, description="Page number"),
        search_query: str = Query(None, description="Search for email, account name"),
        per_page: int = Query(9, alias="per_page", ge=1, le=500, description="Items per page"),
        last_login_date_start: int = Query(None, description="Start date in integer format"),
        last_login_date_end: int = Query(None, description="End date in integer format"),
        join_date_start: int = Query(None, description="Start date in integer format"),
        join_date_end: int = Query(None, description="End date in integer format"),
        admin_customers_service: AdminCustomersService = Depends(get_admin_customers_service)):
    users = admin_customers_service.get_admin_users(search_query=search_query, page=page, per_page=per_page, sort_by=sort_by, sort_order=sort_order, last_login_date_start=last_login_date_start,
                                                    last_login_date_end=last_login_date_end, join_date_start=join_date_start, join_date_end=join_date_end)
    return users


@router.put('/user')
def update_user(update_data: UpdateUserRequest,
                admin_customers_service: AdminCustomersService = Depends(get_admin_customers_service),
                user: dict = Depends(check_user_admin)):
    return admin_customers_service.update_user(update_data)


@router.get('/audience-metrics')
async def get_audience_metrics(
        user: dict = Depends(check_user_admin),
        admin_customers_service: AdminCustomersService = Depends(get_admin_customers_service)):
    users = admin_customers_service.get_audience_metrics()
    return users


@router.get("/generate-token")
async def generate_token(user_account_id: int,
                         admin_customers_service: AdminCustomersService = Depends(get_admin_customers_service),
                         user: dict = Depends(check_user_admin)):
    token = admin_customers_service.generate_access_token(user=user, user_account_id=user_account_id)
    if token:
        return {"token": token}
    raise HTTPException(
        status_code=403,
        detail="Access denied"
    )


@router.post("/invite-user")
async def invite_user(invite_details: InviteDetailsRequest,
                      admin_customers_service: AdminCustomersService = Depends(get_admin_customers_service),
                      user: dict = Depends(check_user_admin)):
    return admin_customers_service.invite_user(user=user, email=invite_details.email, name=invite_details.name)
