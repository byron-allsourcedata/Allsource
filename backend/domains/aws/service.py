import os
from typing import cast
import boto3
from botocore.client import Config

from domains.aws.schemas import PresignedUrlResponse
from resolver import injectable
from services.aws import AWSService as OldAwsService


@injectable
class AwsService:
    def __init__(self, aws_service: OldAwsService) -> None:
        self.old_aws_service = aws_service

        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("S3_KEY_ID"),
            aws_secret_access_key=os.getenv("S3_KEY_SECRET"),
            region_name="us-east-2",
            config=Config(signature_version="s3v4"),
        )

    def presign_upload_url(
        self, bucket_name: str, object_name: str, max_bytes: int
    ) -> PresignedUrlResponse:
        response = self.s3_client.generate_presigned_post(
            Bucket=bucket_name,
            Key=f"uploads/premium-sources/{object_name}",
            Fields={"Content-Type": "text/csv"},
            Conditions=[
                ["starts-with", "$Content-Type", "text/"],
                ["content-length-range", 0, max_bytes],
            ],
            ExpiresIn=3600,
        )

        return cast(PresignedUrlResponse, cast(object, response))
