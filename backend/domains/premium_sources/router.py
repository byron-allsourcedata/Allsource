import logging
from uuid import UUID
from fastapi import APIRouter, UploadFile
from pydantic import BaseModel

from types_boto3_s3.client import S3Client


from db_dependencies import Db
from dependencies import AuthUser
from domains.aws.schemas import PresignedUrlResponse
from domains.aws.service import AwsService
from domains.integrations.schemas import (
    PremiumSourceIntegration,
)
from domains.integrations.service import IntegrationsService
from domains.premium_sources.sync.service import PremiumSourceSyncService
from models.premium_source_sync import PremiumSourceSync
from utils.csv import parse_csv_bytes


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


@router.get("/presigned-url")
def get_presigned_url(aws: AwsService) -> PresignedUrlResponse:
    return aws.presign_upload_url(
        bucket_name=PremiumSourceConfig.BUCKET_NAME,
        object_name="test.csv",
        max_bytes=1 * 1024 * 1024,
    )


@router.get("/list-files")
def list_uploaded_files(aws: AwsService):
    response = aws.s3_client.list_objects_v2(
        Bucket=PremiumSourceConfig.BUCKET_NAME,
        Prefix="uploads/premium-sources",
    )
    return response


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
