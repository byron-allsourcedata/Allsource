from fastapi import APIRouter, Depends, UploadFile, File, Query
from models.users import User
from services.suppression import SuppressionService
from dependencies import get_suppression_service, check_user_authorization
from fastapi.responses import FileResponse
from enums import SuppressionStatus
from schemas.suppressions import SuppressionRequest, CollectionRuleRequest

router = APIRouter()


@router.get("/sample-suppression-list")
def get_sample_suppression_list(suppression_service: SuppressionService = Depends(get_suppression_service), user: User = Depends(check_user_authorization)):
    file_path = suppression_service.get_sample_suppression_list()
    return FileResponse(file_path, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sample-suppression-list.csv"})

@router.post("/suppression-list")
async def process_suppression_list(
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization),
    file: UploadFile = File(...)):
    result = suppression_service.process_suppression_list(user, file)
    if result:
        return SuppressionStatus.SUCCESS
    return SuppressionStatus.INCOMPLETE

@router.get("/suppression-list")
async def get_suppression_list(
    page: int = Query(1, alias="page", ge=1, description="Page number"),
    per_page: int = Query(15, alias="per_page", ge=1, le=100, description="Items per page"),
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization)):
    return suppression_service.get_suppression_list(user, page, per_page)

@router.delete("/suppression-list")
async def delete_suppression_list(suppression_request: SuppressionRequest,
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization)):
    if suppression_service.delete_suppression_list(user, suppression_request.suppression_list_id):
        return SuppressionStatus.SUCCESS
    return SuppressionStatus.INCOMPLETE

@router.get("/download-suppression-list")
async def download_suppression_list(
    suppression_request: SuppressionRequest,
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization)):
    response = suppression_service.download_suppression_list(user, suppression_request.suppression_list_id)
    if response:
        return response
    return SuppressionStatus.INCOMPLETE

@router.post("/suppression-multiple-emails")
async def process_suppression_multiple_emails(suppression_request: SuppressionRequest,
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization)):
    suppression_service.process_suppression_multiple_emails(user, suppression_request.data)
    return SuppressionStatus.SUCCESS

@router.post("/collecting-contacts")
async def process_collecting_contacts(
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization)):
    suppression_service.process_collecting_contacts(user)
    return SuppressionStatus.SUCCESS

@router.get("/rules")
async def get_rules(
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization)):
    return suppression_service.get_rules(user)

@router.post("/certain-activation")
async def process_certain_activation(
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization)):
    suppression_service.process_certain_activation(user)
    return SuppressionStatus.SUCCESS

@router.post("/certain-urls")
async def process_certain_urls(suppression_request: SuppressionRequest,
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization)):
    suppression_service.process_certain_urls(user, suppression_request.data)
    return SuppressionStatus.SUCCESS

@router.post("/based-activation")
async def process_based_activation(
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization)):
    suppression_service.process_based_activation(user)
    return SuppressionStatus.SUCCESS

@router.post("/based-urls")
async def process_based_urls(suppression_request: SuppressionRequest,
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization)):
    suppression_service.process_based_urls(user, suppression_request.data)
    return SuppressionStatus.SUCCESS

@router.post("/collection-rules")
async def process_page_views_limit(collection_rule: CollectionRuleRequest,
    suppression_service: SuppressionService = Depends(get_suppression_service),
    user: User = Depends(check_user_authorization)):
    suppression_service.process_page_views_limit(user, collection_rule.page_views, collection_rule.seconds)
    return SuppressionStatus.SUCCESS
