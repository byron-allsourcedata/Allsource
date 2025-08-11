from resolver import injectable

from domains.aws.service import AwsService


@injectable
class WhitelabelAwsService:
    def __init__(self, aws: AwsService) -> None:
        self.aws = aws

    def upload_image(self, name: str, content: bytes) -> str:
        key = f"/uploads/whitelabel/{name}"
        _ = self.aws.upload_file(key, content)
        return self.aws.get_file_url(key)
