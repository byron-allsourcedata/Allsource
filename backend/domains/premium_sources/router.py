import httpx

import logging
from uuid import UUID
from fastapi import APIRouter, HTTPException, Response, UploadFile
from pydantic import BaseModel

from starlette.responses import StreamingResponse
from types_boto3_s3.client import S3Client


from db_dependencies import Db
from dependencies import AuthUser
from domains.integrations.schemas import (
    PremiumSourceIntegration,
)
from domains.integrations.service import IntegrationsService
from domains.premium_sources.downloads.token import DownloadToken
from domains.premium_sources.exceptions import (
    BadPremiumSourceUrl,
    PremiumSourceNotFound,
    PremiumSourceNotOwned,
)
from domains.premium_sources.premium_sources_payments.exceptions import (
    DeductionNotFound,
    InsufficientFunds,
    MultiplePremiumSourceTransactionsError,
    PriceHasChangedError,
)
from domains.premium_sources.premium_sources_payments.service import (
    PremiumSourcesPaymentsService,
)
from domains.premium_sources.sync.service import PremiumSourceSyncService
from domains.premium_sources.table.service import PremiumSourceTableService
from domains.users.exceptions import UserNotFound
from domains.users.users_funds.exception import (
    MultipleUsersUpdated,
)
from domains.users.users_funds.service import UserFundsService
from utils.csv import parse_csv_bytes
from utils.strings import to_snake_case


from .config import PremiumSourceConfig
from .service import PremiumSourceService
from .sync.router import router as sync_router

logger = logging.getLogger(__name__)

router = APIRouter()

router.include_router(sync_router, prefix="/syncs")


class PremiumSourceCsvMetadata(BaseModel):
    name: str
    rows: int


def validate_uploaded_csv(file: UploadFile) -> PremiumSourceCsvMetadata | None:
    filename = file.filename
    if filename is None:
        return None

    file_bytes = file.file.read()
    rows = parse_csv_bytes(file_bytes)
    n_rows = len(rows)
    return PremiumSourceCsvMetadata(name=filename, rows=n_rows)


def upload_premium_source_to_s3(file: bytes, s3: S3Client, key: str) -> str:
    """
    Upload a premium source and get its key
    """

    upload_key = f"uploads/premium-sources/{key}"

    # TODO: check response for errors
    _ = s3.put_object(
        Bucket=PremiumSourceConfig.BUCKET_NAME,
        Key=upload_key,
        Body=file,
    )

    return upload_key


@router.get("")
@router.get("/")
def get_premium_sources(user: AuthUser, sources_service: PremiumSourceService):
    return sources_service.list(user["id"])


@router.get("/funds")
def get_premium_funds(user: AuthUser, user_funds: UserFundsService):
    user_id = user["id"]

    try:
        return user_funds.premium_funds(user_id)
    except UserNotFound:
        return Response(status_code=403, content="Unauthorized")


@router.get("/unlock")
async def unlock_premium_source(
    user: AuthUser,
    premium_source_id: UUID,
    amount: int,
    payment_method_id: str | None,
    premium_source_payments: PremiumSourcesPaymentsService,
):
    """
    This route expects amount, to account for possibility of price changing since user requested price last time
    """

    user_id = user["id"]

    try:
        premium_source_payments.charge_for_premium_source(
            user_id=user_id,
            premium_source_id=premium_source_id,
            payment_method_id=payment_method_id,
            amount=amount,
        )
        premium_source_payments.commit()
    except UserNotFound:
        return Response(status_code=403, content="Unauthorized")
    except PremiumSourceNotFound:
        return Response(status_code=404, content="File not found")
    except InsufficientFunds:
        return Response(status_code=402, content="Insufficient funds")
    except MultipleUsersUpdated:
        raise HTTPException(status_code=500)
    except MultiplePremiumSourceTransactionsError:
        raise HTTPException(status_code=500)
    except DeductionNotFound:
        raise HTTPException(status_code=500)
    except PriceHasChangedError:
        return Response(status_code=400, content="Price has changed")

    return Response(status_code=200, content="File unlocked")


@router.get("/download-link")
def get_presigned_url(
    user: AuthUser,
    premium_source_id: UUID,
    premium_sources: PremiumSourceService,
):
    try:
        user_id = user["id"]
        download_token = premium_sources.get_download_token(
            user_id, premium_source_id
        )
        return download_token
    except PremiumSourceNotFound:
        return Response(status_code=404, content="File not found")
    except PremiumSourceNotOwned:
        # we'd like to hide which other sources exist
        return Response(status_code=403, content="Forbidden")


@router.get("/download")
def download_raw_premium_source(
    token: str,
    premium_sources: PremiumSourceTableService,
):
    download_token = DownloadToken.decode(token)
    user_id = download_token.user_id
    premium_source_id = download_token.premium_source_id
    try:
        s3_url = premium_sources.get_download_url(user_id, premium_source_id)

        premium_source_name = premium_sources.get_name_unchecked(
            premium_source_id
        )
        filename = to_snake_case(premium_source_name)

        async def file_iterator():
            async with httpx.AsyncClient(
                follow_redirects=True, timeout=None
            ) as client:
                async with client.stream("GET", s3_url) as response:
                    if response.status_code != 200:
                        raise HTTPException(
                            status_code=response.status_code,
                            detail="Error fetching file",
                        )
                    async for chunk in response.aiter_bytes():
                        yield chunk

        return StreamingResponse(
            file_iterator(),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}.csv"'
            },
        )
    except PremiumSourceNotFound:
        return Response(status_code=404, content="File not found")
    except PremiumSourceNotOwned:
        # we'd like to hide which other sources exist
        return Response(status_code=404, content="File not found")
    except BadPremiumSourceUrl:
        # there was a problem with premium source url, it should not be available for download

        logger.error(
            f"User(id={user_id}) requested premium source download, but premium source(id={premium_source_id}) has incorrect source file url"
        )
        return Response(status_code=404, content="File not found")


@router.get("/integrations", response_model=list[PremiumSourceIntegration])
def get_premium_sources_integrations(
    user: AuthUser, integrations: IntegrationsService
):
    user_integrations = integrations.get_premium_sources_integrations(
        user["id"]
    )
    return user_integrations


@router.post("/syncs")
async def create_premium_source_sync(
    user: AuthUser,
    db: Db,
    premium_source_sync_service: PremiumSourceSyncService,
    premium_source_id: UUID,
    user_integration_id: int,
):
    _ = premium_source_sync_service.create_sync_checked(
        user_id=user["id"],
        premium_source_id=premium_source_id,
        user_integration_id=user_integration_id,
    )
    db.commit()
