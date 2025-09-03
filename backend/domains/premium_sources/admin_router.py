import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile
from db_dependencies import Db
from dependencies import Admin
from domains.aws.service import AwsService
from domains.integrations.schemas import PremiumSourceErrorCode
from domains.premium_sources.premium_sources_rows.service import (
    MissingHashedEmailError,
)
from domains.premium_sources.router import (
    upload_premium_source_to_s3,
    validate_uploaded_csv,
)
from domains.premium_sources.schemas import UserPremiumSourcesDto
from domains.premium_sources.service import PremiumSourceService
from middlewares.upload_size import MaxUploadSize100MB
from utils.csv import CSVEncodingError, parse_csv_bytes

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("")
@router.get("/")
def premium_sources(
    _: Admin, serv: PremiumSourceService, user_id: int
) -> UserPremiumSourcesDto:
    return serv.user_sources(user_id)


@router.post("")
@router.post("/")
async def upload_premium_source(
    _admin: Admin,
    _: MaxUploadSize100MB,
    db: Db,
    serv: PremiumSourceService,
    aws: AwsService,
    user_id: int = Form(...),
    source_name: str = Form(...),
    file: UploadFile = File(..., media_type="text/csv"),
):
    # user may not exist
    # file may already be uploaded (re-upload)
    # file may not be valid
    # upload to s3 may fail
    # saving to db may fail
    file_bytes = file.file.read()

    metadata = validate_uploaded_csv(file)

    if metadata is None:
        return HTTPException(status_code=400, detail="Invalid file")

    try:
        s3_key = str(uuid4())
        key = upload_premium_source_to_s3(file_bytes, aws.s3_client, s3_key)
    except Exception as e:
        logger.error(f"Error uploading file to S3: {e}")
        return HTTPException(status_code=500, detail="Failed to save file")

    try:
        csv_rows = parse_csv_bytes(file_bytes)

        if len(csv_rows) < 100:
            return Response(
                status_code=400, content="File contains not enough rows"
            )

        logger.info(
            f"Uploading {len(csv_rows)} hashed rows as premium source for user {user_id}"
        )
        _source_id = save_premium_source(
            serv, user_id, source_name, key, csv_rows=csv_rows[1:]
        )

        db.commit()
    except CSVEncodingError as e:
        logger.error("csv encoding error for premium source")
        return Response(
            status_code=400, content=PremiumSourceErrorCode.BAD_ENCODING
        )
    except MissingHashedEmailError as e:
        logger.error("missing hashed email error")
        return Response(
            status_code=400, content=PremiumSourceErrorCode.MISSING_COLUMN
        )

    except Exception as e:
        logger.error(f"Error saving file to database: {e}")
        return Response(status_code=500, content="Failed to save file")

    return Response(status_code=200)


@router.delete("")
@router.delete("/")
def delete_premium_source(
    _user: Admin, db: Db, serv: PremiumSourceService, premium_source_id: UUID
):
    # TODO: there should not be any syncs for this source
    _ = serv.delete(premium_source_id)
    db.commit()


def save_premium_source(
    serv: PremiumSourceService,
    user_id: int,
    source_name: str,
    key: str,
    csv_rows: list[dict[str, str]],
) -> UUID:
    """
    Raises MissingHashedEmailError
    """
    return serv.create(
        name=source_name,
        user_id=user_id,
        s3_url=key,
        rows=len(csv_rows),
        csv_rows=csv_rows,
    )
