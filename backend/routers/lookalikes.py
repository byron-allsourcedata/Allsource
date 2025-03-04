from fastapi import APIRouter, Depends, Query
from starlette.responses import StreamingResponse

from dependencies import get_lookalikes_service, check_user_authentication
from enums import BaseEnum
from schemas.leads import LeadsRequest
from services.lookalikes import LookalikesService

router = APIRouter()


@router.get("/builder")
async def get_source(
        uuid_of_source: str = Query(None, description="UUID of source"),
        lookalike_service: LookalikesService = Depends(get_lookalikes_service),
        user: dict = Depends(check_user_authentication)
):
    return lookalike_service.get_source_info(uuid_of_source, user)

@router.post("/download_leads")
async def download_leads(leads_request: LeadsRequest,
                         leads_service: LeadsService = Depends(get_leads_service)):
    result = leads_service.download_leads(leads_ids=leads_request.leads_ids)
    if result:
        return StreamingResponse(result, media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=data.csv"})
    return BaseEnum.FAILURE