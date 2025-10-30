from fastapi import APIRouter, Depends, Query, HTTPException
from schemas.admin import (
    InviteDetailsRequest,
    ChangePlanResponse,
    ChangeRequestBody,
    PartnersQueryParams,
)
from services.admin_customers import AdminCustomersService
from dependencies import check_user_admin
from config.rmq_connection import (
    publish_rabbitmq_message_with_channel,
    RabbitMQConnection,
)
from schemas.users import UpdateUserRequest
from domains.whitelabel.admin_router import router as whitelabel_admin_router
from domains.premium_sources.admin_router import (
    router as premium_sources_admin_router,
)

router = APIRouter()

router.include_router(whitelabel_admin_router, prefix="/whitelabel")
router.include_router(premium_sources_admin_router, prefix="/premium-data")


@router.get("/confirm_customer")
async def verify_token(
    admin_customers_service: AdminCustomersService,
    mail: str = Query(...),
    free_trial: bool = Query(...),
    user: dict = Depends(check_user_admin),
):
    user = admin_customers_service.confirmation_customer(mail, free_trial)
    queue_name = f"sse_events_{str(user.id)}"
    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()
    channel = await connection.channel()
    try:
        await publish_rabbitmq_message_with_channel(
            channel=channel,
            queue_name=queue_name,
            message_body={"status": "BOOK_CALL_PASSED", "percent": 50},
        )
    except:
        await rabbitmq_connection.close()
    finally:
        await rabbitmq_connection.close()
    return "OK"


@router.get("/users")
async def get_users(
    admin_customers_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
    sort_by: str = Query(None, description="Field"),
    sort_order: str = Query(
        None, description="Field to sort by: 'asc' or 'desc'"
    ),
    page: int = Query(1, alias="page", ge=1, description="Page number"),
    last_login_date_start: int = Query(
        None, description="Start date in integer format"
    ),
    search_query: str = Query(
        None, description="Search for email, account name"
    ),
    last_login_date_end: int = Query(
        None, description="End date in integer format"
    ),
    join_date_start: int = Query(
        None, description="Start date in integer format"
    ),
    join_date_end: int = Query(None, description="End date in integer format"),
    per_page: int = Query(
        9, alias="per_page", ge=1, le=500, description="Items per page"
    ),
    exclude_test_users: bool = Query(False),
    statuses: str = Query(None),
):
    users = admin_customers_service.get_customer_users(
        search_query=search_query,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
        last_login_date_start=last_login_date_start,
        last_login_date_end=last_login_date_end,
        join_date_start=join_date_start,
        join_date_end=join_date_end,
        exclude_test_users=exclude_test_users,
        statuses=statuses,
    )
    return users


@router.get("/accounts")
async def get_users(
    admin_customers_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
    sort_by: str = Query(None, description="Field"),
    sort_order: str = Query(
        None, description="Field to sort by: 'asc' or 'desc'"
    ),
    page: int = Query(1, alias="page", ge=1, description="Page number"),
    last_login_date_start: int = Query(
        None, description="Start date in integer format"
    ),
    search_query: str = Query(
        None, description="Search for email, account name"
    ),
    last_login_date_end: int = Query(
        None, description="End date in integer format"
    ),
    join_date_start: int = Query(
        None, description="Start date in integer format"
    ),
    join_date_end: int = Query(None, description="End date in integer format"),
    per_page: int = Query(
        9, alias="per_page", ge=1, le=500, description="Items per page"
    ),
    exclude_test_users: bool = Query(False),
    statuses: str = Query(None),
):
    accounts = admin_customers_service.get_customer_accounts(
        search_query=search_query,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
        last_login_date_start=last_login_date_start,
        last_login_date_end=last_login_date_end,
        join_date_start=join_date_start,
        join_date_end=join_date_end,
        exclude_test_users=exclude_test_users,
        statuses=statuses,
    )
    return accounts


@router.get("/admins")
async def get_admins(
    admin_customers_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
    sort_by: str = Query(None, description="Field"),
    sort_order: str = Query(
        None, description="Field to sort by: 'asc' or 'desc'"
    ),
    page: int = Query(1, alias="page", ge=1, description="Page number"),
    search_query: str = Query(
        None, description="Search for email, account name"
    ),
    per_page: int = Query(
        9, alias="per_page", ge=1, le=500, description="Items per page"
    ),
    last_login_date_start: int = Query(
        None, description="Start date in integer format"
    ),
    last_login_date_end: int = Query(
        None, description="End date in integer format"
    ),
    join_date_start: int = Query(
        None, description="Start date in integer format"
    ),
    join_date_end: int = Query(None, description="End date in integer format"),
):
    users = admin_customers_service.get_admin_users(
        search_query=search_query,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
        last_login_date_start=last_login_date_start,
        last_login_date_end=last_login_date_end,
        join_date_start=join_date_start,
        join_date_end=join_date_end,
    )
    return users


@router.get("/partners")
async def get_partners(
    admin_customers_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
    is_master: bool = Query(
        False, description="Flag to switch partners/master-partner"
    ),
    exclude_test_users: bool = Query(
        False, description="Whether to hide users with #test…"
    ),
    sort_by: str | None = Query(None, description="Field"),
    sort_order: str | None = Query(
        None, description="Field to sort by: 'asc' or 'desc'"
    ),
    page: int = Query(1, alias="page", ge=1, description="Page number"),
    search_query: str | None = Query(
        None, description="Search for email, account name"
    ),
    per_page: int = Query(
        9, alias="per_page", ge=1, le=500, description="Items per page"
    ),
    last_login_date_start: int | None = Query(
        None, description="Start date in integer format"
    ),
    last_login_date_end: int | None = Query(
        None, description="End date in integer format"
    ),
    join_date_start: int | None = Query(
        None, description="Start date in integer format"
    ),
    join_date_end: int | None = Query(
        None, description="End date in integer format"
    ),
    statuses: str | None = Query(None),
):
    query_params = PartnersQueryParams(
        is_master=is_master,
        search_query=search_query,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
        exclude_test_users=exclude_test_users,
        last_login_date_start=last_login_date_start,
        last_login_date_end=last_login_date_end,
        join_date_start=join_date_start,
        join_date_end=join_date_end,
        statuses=statuses,
    )
    return admin_customers_service.get_partners_users(query_params)


@router.get("/domains")
async def get_domains(
    admin_domains_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
    sort_by: str | None = Query(None, description="Field to sort by"),
    sort_order: str | None = Query(None, description="'asc' or 'desc'"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=500, description="Items per page"),
    search_query: str | None = Query(
        None, description="Search for domain or user/company name"
    ),
):
    """
    Admin route to fetch paginated domain list with search and sorting.
    """
    return admin_domains_service.get_all_domains_details(
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
        search_query=search_query,
    )


@router.delete("/domains/{domain_id}")
def delete_domain(
    domain_id: int,
    domain_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
):
    domain_service.delete_domain(domain_id)
    return {"status": "SUCCESS"}


@router.put("/change-email-validation", response_model=bool)
def change_email_validation(
    admin_customers_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
    domain_id: int = Query(None),
):
    return admin_customers_service.change_email_validation(
        domain_id=domain_id,
    )


@router.post("/change_plan", response_model=ChangePlanResponse)
def change_email_validation(
    request: ChangeRequestBody,
    admin_customers_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
):
    success = admin_customers_service.did_change_plan(
        user_id=request.user_id, plan_alias=request.plan_alias
    )

    if success:
        return ChangePlanResponse(
            success=True, message="Plan updated successfully"
        )
    return ChangePlanResponse(success=False, message="Plan update failed")


@router.put("/user")
def update_user(
    update_data: UpdateUserRequest,
    admin_customers_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
):
    return admin_customers_service.update_user(update_data)


@router.get("/audience-metrics")
async def get_audience_metrics(
    admin_customers_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
    last_login_date_start: int = Query(
        None, description="Start date in integer format"
    ),
    last_login_date_end: int = Query(
        None, description="End date in integer format"
    ),
    join_date_start: int = Query(
        None, description="Start date in integer format"
    ),
    search_query: str = Query(
        None, description="Search for email, account name"
    ),
    exclude_test_users: bool = Query(False),
    statuses: str = Query(None),
    join_date_end: int = Query(None, description="End date in integer format"),
):
    users = admin_customers_service.get_audience_metrics(
        last_login_date_start=last_login_date_start,
        last_login_date_end=last_login_date_end,
        join_date_start=join_date_start,
        join_date_end=join_date_end,
        statuses=statuses,
        search_query=search_query,
        exclude_test_users=exclude_test_users,
    )
    return users


@router.get("/generate-token")
async def generate_token(
    user_account_id: int,
    admin_customers_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
):
    token = admin_customers_service.generate_access_token(
        user=user, user_account_id=user_account_id
    )
    if token:
        return {"token": token}
    raise HTTPException(status_code=403, detail="Access denied")


@router.post("/invite-user")
async def invite_user(
    invite_details: InviteDetailsRequest,
    admin_customers_service: AdminCustomersService,
    user: dict = Depends(check_user_admin),
):
    return admin_customers_service.invite_user(
        user=user, email=invite_details.email, name=invite_details.name
    )
