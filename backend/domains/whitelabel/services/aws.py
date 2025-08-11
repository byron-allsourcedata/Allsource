from resolver import injectable

from domains.aws.service import AwsService


@injectable
class WhitelabelAwsService:
    def __init__(self, aws: AwsService) -> None:
        self.aws = aws

    def upload_image(self, name: str, content: bytes, content_type: str) -> str:
        key = f"uploads/whitelabel/{name}"
        _ = self.aws.upload_file(key, content, content_type=content_type)
        return self.aws.get_file_url(key)
